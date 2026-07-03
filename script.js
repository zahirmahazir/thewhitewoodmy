/*==================================================
THE WHITE WOOD HOMESTAY
SCRIPT.JS
PART 1
==================================================*/

"use strict";

/*==================================================
CONFIG
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeLinks();

    initializeSlider();

    initializeHeader();

    initializeMobileMenu();

    initializeReveal();

    initializeLightbox();

    initializeSmoothScroll();

});

/*==================================================
GLOBAL CONFIG
==================================================*/

function initializeLinks() {

    if (typeof CONFIG === "undefined") return;

    const setHref = (id, value) => {

        const el = document.getElementById(id);

        if (el) el.href = value;

    };

    setHref("heroWhatsapp", CONFIG.whatsapp);

    setHref("headerWhatsapp", CONFIG.whatsapp);

    setHref("contactWhatsapp", CONFIG.whatsapp);

    setHref("heroAirbnb", CONFIG.airbnb);

    setHref("contactAirbnb", CONFIG.airbnb);

    setHref("airbnbLink", CONFIG.airbnb);

    setHref("contactEmail", CONFIG.email);

    setHref("emailLink", CONFIG.email);

    setHref("contactMaps", CONFIG.maps);

    setHref("mapsButton", CONFIG.maps);

    setHref("mapsLink", CONFIG.maps);

    setHref("instagramLink", CONFIG.instagram);

    setHref("tiktokLink", CONFIG.tiktok);

    setHref("googleReviewButton", CONFIG.googleReview);

    const iframe = document.getElementById("googleMap");

    if (iframe && CONFIG.googleMapEmbed) {

        iframe.src = CONFIG.googleMapEmbed;

    }

}

/*==================================================
BACKGROUND SLIDER
==================================================*/

function initializeSlider() {

    const slides = document.querySelectorAll(".hero-slider__image");

    if (!slides.length) return;

    let current = 0;

    setInterval(() => {

        slides[current].classList.remove("active");

        current++;

        if (current >= slides.length) {

            current = 0;

        }

        slides[current].classList.add("active");

    }, 7000);

}

/*==================================================
HEADER
==================================================*/

function initializeHeader() {

    const header = document.querySelector(".header");

    if (!header) return;

    const update = () => {

        if (window.scrollY > 80) {

            header.classList.add("scrolled");

        }

        else {

            header.classList.remove("scrolled");

        }

    };

    update();

    window.addEventListener("scroll", update);

}

/*==================================================
MOBILE MENU
==================================================*/

function initializeMobileMenu() {

    const button = document.querySelector(".mobile-menu");

    const nav = document.querySelector(".navigation");

    if (!button || !nav) return;

    button.addEventListener("click", () => {

        nav.classList.toggle("active");

        document.body.classList.toggle("no-scroll");

    });

    document

        .querySelectorAll(".navigation a")

        .forEach(link => {

            link.addEventListener("click", () => {

                nav.classList.remove("active");

                document.body.classList.remove("no-scroll");

            });

        });

}

/*==================================================
REVEAL ANIMATION
==================================================*/

function initializeReveal() {

    const elements = document.querySelectorAll(

        ".section,.facility-card,.gallery-card,.review-card,.contact-card"

    );

    const observer = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("active");

                }

            });

        },

        {

            threshold:0.15

        }

    );

    elements.forEach(item => {

        item.classList.add("reveal");

        observer.observe(item);

    });

}
/*==================================================
LIGHTBOX
==================================================*/

function initializeLightbox() {

    const lightbox = document.getElementById("lightbox");

    const image = document.getElementById("lightboxImage");

    const close = document.querySelector(".lightbox__close");

    const gallery = document.querySelectorAll(".gallery-card");

    if (!lightbox || !image || !gallery.length) return;

    gallery.forEach(card => {

        card.addEventListener("click", e => {

            e.preventDefault();

            const img = card.querySelector("img");

            if (!img) return;

            image.src = img.src;

            image.alt = img.alt;

            lightbox.classList.add("active");

            document.body.classList.add("no-scroll");

        });

    });

    const closeLightbox = () => {

        lightbox.classList.remove("active");

        document.body.classList.remove("no-scroll");

        setTimeout(() => {

            image.src = "";

        },300);

    };

    close.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", e => {

        if(e.target===lightbox){

            closeLightbox();

        }

    });

    document.addEventListener("keydown",e=>{

        if(e.key==="Escape"){

            closeLightbox();

        }

    });

}

/*==================================================
SMOOTH SCROLL
==================================================*/

function initializeSmoothScroll(){

    const links=document.querySelectorAll('a[href^="#"]');

    links.forEach(link=>{

        link.addEventListener("click",function(e){

            const target=document.querySelector(this.getAttribute("href"));

            if(!target) return;

            e.preventDefault();

            target.scrollIntoView({

                behavior:"smooth",

                block:"start"

            });

        });

    });

}

/*==================================================
AUTO FOOTER YEAR
==================================================*/

(function(){

    const footer=document.querySelector(".footer__copyright");

    if(!footer) return;

    const year=new Date().getFullYear();

    footer.innerHTML=

    `© ${year} The White Wood Homestay. All Rights Reserved.`;

})();

/*==================================================
PRELOAD GALLERY
==================================================*/

(function(){

    const images=document.querySelectorAll(".gallery-card img");

    images.forEach(img=>{

        const preload=new Image();

        preload.src=img.src;

    });

})();

/*==================================================
IMAGE LAZY ENHANCEMENT
==================================================*/

(function(){

    const images=document.querySelectorAll("img");

    images.forEach(img=>{

        img.loading="lazy";

        img.decoding="async";

    });

})();

/*==================================================
SCROLL PROGRESS
==================================================*/

(function(){

    const progress=document.createElement("div");

    progress.className="scroll-progress";

    document.body.appendChild(progress);

    const update=()=>{

        const h=document.documentElement;

        const total=h.scrollHeight-h.clientHeight;

        const percent=(window.scrollY/total)*100;

        progress.style.width=percent+"%";

    };

    update();

    window.addEventListener("scroll",update);

})();

/*==================================================
BUTTON RIPPLE EFFECT
==================================================*/

(function(){

    const buttons=document.querySelectorAll(".button");

    buttons.forEach(button=>{

        button.addEventListener("click",function(e){

            const ripple=document.createElement("span");

            ripple.className="ripple";

            const rect=this.getBoundingClientRect();

            const size=Math.max(rect.width,rect.height);

            ripple.style.width=size+"px";

            ripple.style.height=size+"px";

            ripple.style.left=(e.clientX-rect.left-size/2)+"px";

            ripple.style.top=(e.clientY-rect.top-size/2)+"px";

            this.appendChild(ripple);

            setTimeout(()=>{

                ripple.remove();

            },600);

        });

    });

})();

/*==================================================
GOOGLE REVIEW PLACEHOLDER
Future API Hook
==================================================*/

async function loadGoogleReviews(){

    /*
        Future Version

        Google Places API

        Fetch Reviews

        Render Review Cards

    */

}

/*==================================================
WINDOW RESIZE
==================================================*/

window.addEventListener("resize",()=>{

    const nav=document.querySelector(".navigation");

    if(window.innerWidth>991){

        nav?.classList.remove("active");

        document.body.classList.remove("no-scroll");

    }

});

/*==================================================
PAGE LOADED
==================================================*/

window.addEventListener("load",()=>{

    document.body.classList.add("loaded");

});

/*==================================================
END OF FILE

THE WHITE WOOD HOMESTAY

VERSION 2.0

SCRIPT.JS

LOCKED

==================================================*/