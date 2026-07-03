/*==================================================
seo.js
Production Version
The White Wood Homestay
==================================================*/

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    initializeSEO();

});

function initializeSEO() {

    updateTitle();

    updateMetaDescription();

    updateCanonical();

    updateOpenGraph();

    updateTwitterCard();

    injectStructuredData();

}

/*==================================================
TITLE
==================================================*/

function updateTitle() {

    document.title =
        `${CONFIG.businessName} | Premium Homestay in Ara Kuda, Penang`;

}

/*==================================================
DESCRIPTION
==================================================*/

function updateMetaDescription() {

    setMeta(

        "description",

        "Stay at The White Wood Homestay in Ara Kuda, Penang. Spacious, family-friendly accommodation with fast WiFi, free parking and modern amenities."

    );

}

/*==================================================
CANONICAL
==================================================*/

function updateCanonical() {

    let canonical = document.querySelector(

        "link[rel='canonical']"

    );

    if (!canonical) {

        canonical = document.createElement("link");

        canonical.rel = "canonical";

        document.head.appendChild(canonical);

    }

    canonical.href = CONFIG.website;

}

/*==================================================
OPEN GRAPH
==================================================*/

function updateOpenGraph() {

    setProperty("og:title",

        CONFIG.businessName

    );

    setProperty(

        "og:description",

        "Premium Homestay in Ara Kuda, Penang."

    );

    setProperty(

        "og:image",

        CONFIG.ogImage

    );

    setProperty(

        "og:url",

        CONFIG.website

    );

    setProperty(

        "og:type",

        "website"

    );

}

/*==================================================
TWITTER
==================================================*/

function updateTwitterCard() {

    setMeta(

        "twitter:card",

        "summary_large_image"

    );

    setMeta(

        "twitter:title",

        CONFIG.businessName

    );

    setMeta(

        "twitter:description",

        "Premium Homestay in Penang."

    );

    setMeta(

        "twitter:image",

        CONFIG.ogImage

    );

}

/*==================================================
JSON-LD
==================================================*/

function injectStructuredData() {

    const script = document.createElement("script");

    script.type = "application/ld+json";

    script.textContent = JSON.stringify({

        "@context": "https://schema.org",

        "@type": "LodgingBusiness",

        name: CONFIG.businessName,

        image: CONFIG.ogImage,

        url: CONFIG.website,

        telephone: CONFIG.phone,

        email: CONFIG.email.replace("mailto:",""),

        address: {

            "@type":"PostalAddress",

            addressCountry:"MY",

            addressRegion:"Penang"

        },

        sameAs:[

            CONFIG.airbnb,

            CONFIG.instagram,

            CONFIG.tiktok

        ]

    });

    document.head.appendChild(script);

}

/*==================================================
HELPER
==================================================*/

function setMeta(name, content) {

    let meta = document.querySelector(

        `meta[name="${name}"]`

    );

    if (!meta) {

        meta = document.createElement("meta");

        meta.name = name;

        document.head.appendChild(meta);

    }

    meta.content = content;

}

function setProperty(property, content) {

    let meta = document.querySelector(

        `meta[property="${property}"]`

    );

    if (!meta) {

        meta = document.createElement("meta");

        meta.setAttribute(

            "property",

            property

        );

        document.head.appendChild(meta);

    }

    meta.content = content;

}