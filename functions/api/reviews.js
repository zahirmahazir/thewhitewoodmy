// =========================================================
// THE WHITE WOOD — GOOGLE REVIEWS API
// Cloudflare Pages Function + Google Places API (New)
//
// Required Cloudflare environment variables/secrets:
//   GOOGLE_PLACES_API_KEY
//   GOOGLE_PLACE_ID
//
// Keep the API key in Cloudflare, NOT in frontend JS or GitHub.
// =========================================================

export async function onRequestGet({ env }) {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const placeId = env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return json(
      { error: "Google Places API is not configured." },
      500
    );
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews,googleMapsUri"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return json(
        { error: "Google Places API request failed.", details: data },
        response.status
      );
    }

    return json({
      name: data.displayName?.text || "The White Wood Homestay",
      rating: data.rating || 0,
      userRatingCount: data.userRatingCount || 0,
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
      googleMapsUri: data.googleMapsUri || ""
    });
  } catch (error) {
    return json(
      { error: "Unable to contact Google Places API." },
      502
    );
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}
