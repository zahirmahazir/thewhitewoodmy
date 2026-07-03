/*==================================================
google-review.js
The White Wood Homestay
Cloudflare Pages + Google Places API (New)
==================================================*/

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    loadGoogleReviews();
});

async function loadGoogleReviews() {

    const container = document.getElementById("reviewContainer");
    const rating = document.getElementById("googleRating");
    const total = document.getElementById("googleReviewCount");

    if (!container) return;

    container.innerHTML = `
        <div class="review-loading">
            Loading Google Reviews...
        </div>
    `;

    try {

        const response = await fetch("/api/reviews");

        if (!response.ok) {
            throw new Error("Unable to fetch Google Reviews");
        }

        const data = await response.json();

        console.log("Google Reviews:", data);

        container.innerHTML = "";

        if (rating) {
            rating.textContent = Number(data.rating || 0).toFixed(1);
        }

        if (total) {
            total.textContent = `${data.userRatingCount || 0} Google Reviews`;
        }

        if (!Array.isArray(data.reviews) || data.reviews.length === 0) {

            container.innerHTML = `
                <div class="review-empty">
                    No Google Reviews yet.
                </div>
            `;

            return;
        }

        data.reviews.forEach(r => {

            const author =
                r.authorAttribution?.displayName ??
                "Google User";

            const reviewText =
                r.text?.text ??
                r.originalText?.text ??
                "";

            const review = {
                rating: Number(r.rating || 5),
                author: author,
                text: reviewText,
                publishTime: r.publishTime
            };

            container.appendChild(createReviewCard(review));

        });

    }
    catch (err) {

        console.error(err);

        container.innerHTML = `
            <div class="review-empty">
                Unable to load Google Reviews.
            </div>
        `;

    }

}

function createReviewCard(review) {

    const card = document.createElement("article");

    card.className = "review-card";

    const author = String(review.author || "Google User");
    const avatar = author.substring(0,1).toUpperCase();
    const text = String(review.text || "");
    const stars = createStars(Number(review.rating || 5));
    const date = formatDate(review.publishTime);

    card.innerHTML = `
        <div class="review-card__stars">
            ${stars}
        </div>

        <p class="review-card__text">
            ${text}
        </p>

        <div class="review-card__footer">

            <div class="review-card__avatar">
                ${avatar}
            </div>

            <div class="review-card__info">

                <h4>${author}</h4>

                <span>${date}</span>

            </div>

        </div>
    `;

    return card;

}

function createStars(total) {

    total = Math.max(0, Math.min(5, Number(total)));

    return "★★★★★".slice(0, total);

}

function formatDate(date) {

    if (!date) return "";

    try {

        return new Date(date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    } catch {

        return "";

    }

}
