if(loadError) throw new Error("Previous loading error");

import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader';
import {RenderPass} from 'three/addons/postprocessing/RenderPass';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer';

clearInterval(loading_interval);
loading_text.innerText = "0 %";

function setSectionVisible(target, visible){
    document.querySelectorAll(`.floatsection[idtarget="${target}"]`).forEach(e => {
        e.classList.add(visible ? 'show' : 'hide');
        e.classList.remove(!visible ? 'show' : 'hide');
    });
}

function stopManual(name){
    world.animations[name].stop();
}

function playManual(name, stop = true, mode = THREE.LoopOnce){
    if(!stop && world.animations[name].isRunning()) return;
    stopManual(name);

    if(mode) world.animations[name].loop = mode;
    world.animations[name].play();
}

let progressbars = document.querySelectorAll(".progress");

const animations = {
    "AboutMe": {
        enter(){
            setSectionVisible("AboutMe", true);
        },
        leave(){
            setSectionVisible("AboutMe", false);
        }
    },
    "Skills": {
        enter(){
            setSectionVisible("Skills", true);
            progressbars.forEach(b => {
                b.classList.add('show');
                b.classList.remove('hide');
            });
        },
        leave(){
            setSectionVisible("Skills", false);
            progressbars.forEach(b => {
                b.classList.remove('show');
                b.classList.add('hide');
            });
        }
    },
    "Projects1": {
        enter(){
            setSectionVisible("Projects1", true);
        },
        leave(){
            setSectionVisible("Projects1", false);
        }
    },
    "Projects2": {
        enter(){
            setSectionVisible("Projects2", true);
        },
        leave(){
            setSectionVisible("Projects2", false);
        }
    },
    "ContactMe": {
        enter(){
            setSectionVisible("ContactMe", true);
        },
        leave(){
            setSectionVisible("ContactMe", false);
        }
    },
}

class World {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this.loader = new GLTFLoader();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.querySelector("#renderer")
        });

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        window.addEventListener('resize', () => {
            this._OnResize();
        }, false);

        window.addEventListener('mousemove', (e) => {
            if(this.mouse){
                var rect = this.renderer.domElement.getBoundingClientRect();
                this.mouse.x = ((e.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
                this.mouse.y = -((e.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;
            }
        });

        this.renderer.domElement.addEventListener('mousedown', () => {
            if(this.targeted != null) this.clickable[this.targeted]();
        })
        
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.shadowButton = document.querySelector("#shadowbutton");
        this.shadowButton.addEventListener('click', () => this.toggleShadows());
        this.shadow = true;
        
        this._BuildScene();
        this._ConfigureRendering();
        
        this._LoadScene();
        this._animate();
        this.toggleShadows(); // false
    }
  
    _OnResize() {
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;

        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.sizes.width, this.sizes.height);

        if(this.composer) this.composer.setSize(this.sizes.width, this.sizes.height);
        if(this.bloomPass) this.bloomPass.setSize(this.sizes.width, this.sizes.height);
    }
    
    _animate() {
        requestAnimationFrame(() => {
            updateAllLooks();
            if(this.clickable) this._UpdateClickable();

            if(this.mixer) this.mixer.update(this.clock.getDelta());
            if(this.composer) this.composer.render(this.scene, this.camera);
            this._animate();
        });
    }

    _BuildScene(){
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#929999");
        this.scene.add(new THREE.AmbientLight(0xFFFFFF, .9));
    }

    _ConfigureRendering(){
        this.camera = new THREE.PerspectiveCamera(60, this.sizes.width/this.sizes.height, 1, 1000);
        this.camera.position.set(0, 4, 8);
        this.camera.rotation.set(0, 0, 0);
        this._OnResize();

        this.composer = new EffectComposer(this.renderer);
        this.renderScene = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderScene);
        // this.bloomPass = new UnrealBloomPass(new THREE.Vector2( this.sizes.width, this.sizes.height ), .4, .1, 1);
        // this.composer.addPass(this.bloomPass);
    }
    
    _LoadScene(){
        this.loader.load('./assets/3d/scene.gltf', (imported) => {
            // Loading scene
            console.log(imported);
            this.scene.add(imported.scene);
            this.scene.traverse(c => {
                if(c.type == 'DirectionalLight'){
                    c.lookAt(0,0,0);
                    const offset = 10;
                    c.shadow.camera.left = -offset;
                    c.shadow.camera.top = -offset;
                    c.shadow.camera.right = offset;
                    c.shadow.camera.bottom = offset;
                    c.shadow.mapSize = new THREE.Vector2(1024, 1024);
                    c.shadow.bias -= 0.0005;
                }
            });

            this._RegisterClickableObjects();

            // Animation
            this.clock = new THREE.Clock();
            this.mixer = new THREE.AnimationMixer(this.scene);
            this.animations = {};

            imported.animations.forEach(clip => {
                let action = this.mixer.clipAction(clip);

                if(!clip.name.startsWith("manual.")) action.play();
                else this.animations[clip.name] = action;
            });
            
            // Camera points
            this.canSwitch = true;
            document.querySelectorAll("button").forEach(b => {
                let id = b.getAttribute('idtarget');
                if(id) b.addEventListener('click', () => this.goToPoint(id));
            });
            this.camera_points = Object.fromEntries(
                this.scene.getObjectsByProperty('isCamera', true)
                .map(c => [c.name.substring(6), {pos: c.position, rot: c.quaternion, fov: c.fov}])
            );
            
            // End
            this.hideLoadingScreen();
            clearLoadingErrors();
            this.goToPoint("AboutMe", 0);
        },
        (req) => {
            let progress = math.min(req.loaded / req.total * 100, 100).toFixed(1);
            loading_text.innerText = `${progress} %`;
            loading_bg.style.width = `${progress}%`;
        },
        (err) => {
            console.log(err);
            loadingError();
        });
    }

    _RegisterClickableObjects(){
        this.clickable = {
            'Card': () => playManual('manual.card.spin', false),
            'Ecran': () => playManual('manual.pcscreen.spin', false),
            'RepereBall': () => playManual('manual.repere.pulse', true),
            'Bomb': () => {
                playManual('manual.bomb.burst', false);
                playManual('manual.bomb.number', false);
            },
            'GearContainer': () => playManual('manual.gears.spin1', false),
        }
        this.clickableList = [...Object.keys(this.clickable)].map(k => this.scene.getObjectByName(k));
        console.log(this.clickableList);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(1, 1);
    }

    _UpdateClickable(){
        var intersects = [];
        this.raycaster.setFromCamera(this.mouse, this.camera);

    	intersects = this.raycaster.intersectObjects(this.clickableList, true);
    	if (intersects.length !== 0) {
            let obj = intersects[0].object;
            while(obj && !this.clickable[obj.name]) obj = obj.parent;

            if(obj) this.targeted = obj.name;
    		this.renderer.domElement.classList.add('hover');
            return;
    	}
        
        this.targeted = null;
        this.renderer.domElement.classList.remove('hover');
    }

    hideLoadingScreen(){
        loading_screen.style.opacity = "0";
        setInterval(() => loading_screen.style.display = 'none', 600);
    }

    goToPoint(name, duration = 1){
        if(this.currentPoint == name || !this.canSwitch) return;
        this.canSwitch = false;
        setTimeout(() => this.canSwitch = true, 1000);

        if(this.currentPoint) animations[this.currentPoint].leave();
        this.currentPoint = name;
        animations[this.currentPoint].enter();

        let {pos, rot, fov} = this.camera_points[this.currentPoint];

        let oldQuaternion = this.camera.quaternion.clone();
        let interp = {t: 0};
        
        gsap.to(this.camera.position, {duration: duration, x: pos.x, y: pos.y, z: pos.z});
        gsap.to(interp, {duration: duration, t:1, onUpdate: () => this.camera.quaternion.slerpQuaternions(oldQuaternion, rot, interp.t)});
    }

    nextPoint(){
        this.goToPoint((this.currentPoint+1)%this.points.length);
    }

    toggleShadows(){
        this.shadow = !this.shadow;

        this.scene.traverse(c => {
            if(c.isMesh || (c.isLight && c.type != "AmbientLight")) c.castShadow = this.shadow;
            if(c.isMesh) c.receiveShadow = this.shadow;
        });

        this.shadowButton.innerText = this.shadow ? 'Disable shadows' : 'Enable shadows';
    }
}

const world = new World();
