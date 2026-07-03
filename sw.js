/*==================================================
sw.js
Production Version
The White Wood Homestay
==================================================*/

"use strict";

const CACHE_NAME = "thewhitewood-v1";

const ASSETS = [

    "/",

    "/index.html",

    "/style.css",

    "/effects.css",

    "/review.css",

    "/script.js",

    "/config.js",

    "/google-review.js",

    "/seo.js",

    "/performance.js",

    "/manifest.json",

    "/assets/logo.png",

    "/assets/hero1.jpg",

    "/assets/hero2.jpg",

    "/assets/hero3.jpg",

    "/assets/favicon.ico"

];

/*==================================================
INSTALL
==================================================*/

self.addEventListener("install", event => {

    event.waitUntil(

        caches

            .open(CACHE_NAME)

            .then(cache =>

                cache.addAll(ASSETS)

            )

    );

    self.skipWaiting();

});

/*==================================================
ACTIVATE
==================================================*/

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys =>

            Promise.all(

                keys

                    .filter(

                        key =>

                        key !== CACHE_NAME

                    )

                    .map(

                        key =>

                        caches.delete(key)

                    )

            )

        )

    );

    self.clients.claim();

});

/*==================================================
FETCH
==================================================*/

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    event.respondWith(

        caches.match(event.request)

        .then(cache => {

            return (

                cache ||

                fetch(event.request)

                .then(response => {

                    const clone = response.clone();

                    caches

                        .open(CACHE_NAME)

                        .then(cache => {

                            cache.put(

                                event.request,

                                clone

                            );

                        });

                    return response;

                })

                .catch(() => {

                    return caches.match(

                        "/index.html"

                    );

                })

            );

        })

    );

});

/*==================================================
MESSAGE
==================================================*/

self.addEventListener("message", event => {

    if (

        event.data &&

        event.data.type === "SKIP_WAITING"

    ) {

        self.skipWaiting();

    }

});

/*==================================================
END
==================================================*/