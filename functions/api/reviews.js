export async function onRequestGet(context) {
  const { env } = context;

  const API_KEY = env.GOOGLE_API_KEY;
  const PLACE_ID = env.GOOGLE_PLACE_ID;

  if (!API_KEY || !PLACE_ID) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing GOOGLE_API_KEY or GOOGLE_PLACE_ID"
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

  try {
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=displayName,rating,userRatingCount,reviews&key=${API_KEY}`;

    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask":
          "displayName,rating,userRatingCount,reviews"
      }
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=1800"
      }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
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