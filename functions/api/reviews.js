
export async function onRequestGet({ env }) {
  const API_KEY = env.GOOGLE_API_KEY;
  const PLACE_ID = env.GOOGLE_PLACE_ID;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  };

  if (!API_KEY || !PLACE_ID) {
    return new Response(
      JSON.stringify({
        error: "Google Places API is not configured.",
        missing: [
          ...(!API_KEY ? ["GOOGLE_API_KEY"] : []),
          ...(!PLACE_ID ? ["GOOGLE_PLACE_ID"] : [])
        ]
      }),
      { status: 500, headers }
    );
  }

  try {
    const placeId = PLACE_ID.trim().replace(/^places\//, "");

    const url =
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask":
          "displayName,rating,userRatingCount,reviews",
        "Accept": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // Do not expose the API key or request URL.
      return new Response(
        JSON.stringify({
          error: "Google Places API request failed.",
          status: response.status,
          details: data.error
            ? {
                code: data.error.code,
                message: data.error.message,
                status: data.error.status
              }
            : "No additional error details returned."
        }),
        { status: response.status, headers }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: "Unable to connect to Google Places API."
      }),
      { status: 502, headers }
    );
  }
}
