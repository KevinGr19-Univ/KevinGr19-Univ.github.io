class Carousel{ // From SAE
    constructor(container){
        this.container = container;
        container.classList.add("carousel");  

        this.images = document.createElement("div");
        this.images.classList.add("carousel-images");
        container.appendChild(this.images);

        this.imageList = [...container.querySelectorAll("img")];
        for(let img of this.imageList) this.images.appendChild(img);

        this.ui = document.createElement("div");
        this.ui.classList.add("carousel-ui");
        container.appendChild(this.ui);

        this.buttons = document.createElement("div");
        this.buttons.classList.add("carousel-buttons");
        container.appendChild(this.buttons);

        this.current = 0;
    }

    initialise(){
        let leftButton = document.createElement("p");
        leftButton.innerText = "◀";
        leftButton.classList.add("carousel-button");
        leftButton.style.left = "0";
        leftButton.onclick = () => this.goto(this.current-1);
        this.buttons.appendChild(leftButton);

        let rightButton = document.createElement("p");
        rightButton.innerText = "▶";
        rightButton.classList.add("carousel-button");
        rightButton.style.right = "0";
        rightButton.onclick = () => this.goto(this.current+1);
        this.buttons.appendChild(rightButton);

        for(let i in this.imageList){
            let link = document.createElement("a");
            this.ui.appendChild(link);

            link.imgid = i;
            link.onclick = () => this.goto(i);
        }

        window.addEventListener('resize', () => this.updateScroll());
        this.goto(0);

        this.startAutoScroll();
        this.container.addEventListener('mouseleave', () => this.startAutoScroll());
        this.container.addEventListener('mouseenter', () => clearInterval(this.autoScroll));
    }

    startAutoScroll(){
        this.autoScroll = setInterval(() => this.goto(this.current+1), 8000);
    }

    goto(i){
        i %= this.imageList.length;
        if(i < 0) i += this.imageList.length;

        for(let link of this.ui.querySelectorAll("a")){
            if(link.imgid == i) link.classList.add("carousel-active");
            else link.classList.remove("carousel-active");
        }

        this.current = i;
        this.updateScroll();
    }

    updateScroll(){
        this.images.scrollTo({behavior: 'smooth', left: this.current/this.imageList.length * this.images.scrollWidth});
    }
}