/*==================================================
performance.js
Production Version
The White Wood Homestay
==================================================*/

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    preloadHeroImages();

    lazyLoadImages();

    optimizeVideo();

    registerServiceWorker();

    observeSections();

    optimizeAnimations();

});

/*==================================================
PRELOAD HERO
==================================================*/

function preloadHeroImages() {

    if (!CONFIG.heroImages) return;

    CONFIG.heroImages.forEach(src => {

        const link = document.createElement("link");

        link.rel = "preload";

        link.as = "image";

        link.href = src;

        document.head.appendChild(link);

    });

}

/*==================================================
LAZY LOAD
==================================================*/

function lazyLoadImages() {

    const images = document.querySelectorAll("img");

    images.forEach(img => {

        if (!img.hasAttribute("loading")) {

            img.loading = "lazy";

        }

        if (!img.hasAttribute("decoding")) {

            img.decoding = "async";

        }

    });

}

/*==================================================
VIDEO
==================================================*/

function optimizeVideo() {

    document.querySelectorAll("video").forEach(video => {

        video.preload = "metadata";

    });

}

/*==================================================
SECTION OBSERVER
==================================================*/

function observeSections() {

    const sections = document.querySelectorAll("section");

    const observer = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("visible");

                }

            });

        },

        {

            threshold:0.15

        }

    );

    sections.forEach(section => {

        observer.observe(section);

    });

}

/*==================================================
REDUCE ANIMATION
==================================================*/

function optimizeAnimations() {

    if (

        window.matchMedia(

            "(prefers-reduced-motion: reduce)"

        ).matches

    ) {

        document.documentElement.classList.add(

            "reduce-motion"

        );

    }

}

/*==================================================
SERVICE WORKER
==================================================*/

function registerServiceWorker() {

    if (

        "serviceWorker" in navigator

    ) {

        window.addEventListener(

            "load",

            () => {

                navigator.serviceWorker

                .register("/sw.js")

                .catch(console.error);

            }

        );

    }

}

/*==================================================
NETWORK
==================================================*/

window.addEventListener(

    "load",

    () => {

        if (

            navigator.connection

        ) {

            const connection =

                navigator.connection;

            console.log(

                "Connection:",

                connection.effectiveType

            );

        }

    }

);

/*==================================================
END
==================================================*/