// worker.js
// Cloudflare Worker
// The White Wood Homestay

export default {

    async fetch(request, env) {

        const placeId = env.GOOGLE_PLACE_ID;

        const apiKey = env.GOOGLE_API_KEY;

        const url =
            `https://places.googleapis.com/v1/places/${placeId}` +
            `?fields=displayName,rating,userRatingCount,reviews` +
            `&key=${apiKey}`;

        try {

            const response = await fetch(url, {

                headers: {

                    "Content-Type": "application/json"

                }

            });

            if (!response.ok) {

                return new Response(

                    JSON.stringify({

                        success: false,

                        status: response.status,

                        message: "Google Places API Error"

                    }),

                    {

                        status: response.status,

                        headers: {

                            "Content-Type": "application/json",

                            "Access-Control-Allow-Origin": "*"

                        }

                    }

                );

            }

            const data = await response.json();

            const result = {

                success: true,

                business: data.displayName?.text ?? "",

                rating: data.rating ?? 0,

                totalReviews: data.userRatingCount ?? 0,

                reviews: (data.reviews || []).map(review => ({

                    author: review.authorAttribution?.displayName ?? "Guest",

                    rating: review.rating,

                    text: review.text?.text ?? "",

                    publishTime: review.publishTime,

                    profilePhoto:

                        review.authorAttribution?.photoUri ?? ""

                }))

            };

            return new Response(

                JSON.stringify(result),

                {

                    headers: {

                        "Content-Type": "application/json",

                        "Access-Control-Allow-Origin": "*",

                        "Cache-Control":

                            "public, max-age=1800"

                    }

                }

            );

        }

        catch (error) {

            return new Response(

                JSON.stringify({

                    success: false,

                    message: error.message

                }),

                {

                    status: 500,

                    headers: {

                        "Content-Type": "application/json",

                        "Access-Control-Allow-Origin": "*"

                    }

                }

            );

        }

    }

};