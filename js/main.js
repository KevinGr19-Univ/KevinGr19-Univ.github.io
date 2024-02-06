//#region Loading stuff
const loading_text = document.querySelector("#loading_text");
const loading_bg = document.querySelector("#loading_bg");
const loading_screen = document.querySelector("#loading_screen");

var loadError = null;

let loading_interval;
(() => {
    let i = 0;
    const changeText = () => loading_text.innerText = `Chargement des librairies${'.'.repeat(i++%4)}`;
    loading_interval = setInterval(changeText, 800);
    changeText();
})();

function loadingError(){
    if(loadError != null) return;
    loadError = true;
    console.warn("Load Error");

    clearInterval(loading_interval);
    loading_bg.style.width = "100%";
    loading_bg.style.background = "red";
    loading_bg.style.transition = "none";
    loading_text.innerText = "Impossible de charger la page.";
}

function clearLoadingErrors(){
    if(loadError != null) return;
    loadError = false;
    document.querySelectorAll(".script").forEach(s => s.onerror = (err) => {});
}
//#endregion

//#region Lightbox
const lightbox = document.querySelector("#lightbox");
const lightbox_container = document.querySelector("#lightboxcontainer");
let canSwitchLightbox = true;
function openLightbox(){
    if(!canSwitchLightbox) return;
    canSwitchLightbox = false;
    
    lightbox.style.display = 'flex';
    lightbox_container.classList.add("show");
    lightbox_container.classList.remove("hide");
    lightbox.classList.remove("hide");
    
    setTimeout(() => {canSwitchLightbox = true;}, 500);
}

function closeLightbox(){
    if(!canSwitchLightbox) return;
    canSwitchLightbox = false;

    lightbox_container.classList.remove("show");
    lightbox_container.classList.add("hide");
    lightbox.classList.add("hide");
    
    setTimeout(() => {
        lightbox.style.display = 'none';
        canSwitchLightbox = true;
    }, 500);
}
//#endregion

//#region 3D effects
function normalize(x, y, z){
    let length = Math.sqrt(x*x + y*y + z*z);
    if(!length) return [0, 0, 0];

    return [x/length, y/length, z/length];
}

function updateLook(f){
    const { left, top, width, height } = f.getBoundingClientRect();
    const cX = left + width/2;
    const cY = top + height/2;

    let [x, y, z] = normalize(pointerX - cX, pointerY - cY, pointerZ);
    let yaw = Math.atan2(x, z);
    let pitch = Math.atan2(Math.sqrt(x*x + z*z), y) - Math.PI/2;
    
    f.style.transform = `perspective(75em) rotateY(${yaw}rad) rotateX(${pitch}rad)`;
}

function updateAllLooks(){
    floatsections.forEach(updateLook);
}

let pointerX = window.innerWidth/2, pointerY = window.innerHeight/2;
const pointerZ = 4000; // Elements Z = 0, Curseur Z = pointerZ => +proche de 0 = +sensible

let floatsections = document.querySelectorAll(".floatsection");

document.addEventListener('mousemove', (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    // updateAllLooks(); in 3dscene.js RAF
});
//#endregion

const downloadResumeLink = document.querySelector("#downloadresume");
let downloads = 0;

function downloadResume(button){
    downloadResumeLink.click();
    if(++downloads >= 18){
        button.innerText = "That's it, no more downloads for you.";
        button.disabled = true;
        button.classList.add("angry");
    }
    else if(downloads >= 12) button.innerText = "That was funny for two seconds, cut it off.";
    else if(downloads >= 5) button.innerText = "You don't need that many, do you ?";
}

document.querySelectorAll(".carousel").forEach(c => {
    c.querySelectorAll("img").forEach(img => {
        img.addEventListener('click', () => {
            let _img = document.createElement("img");
            _img.src = img.src;
            
            lightbox_container.innerHTML = "";
            lightbox_container.appendChild(_img);
            openLightbox();
        });
    });
    let carousel = new Carousel(c);
    carousel.initialise();
});