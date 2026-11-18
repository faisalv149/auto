/*
 * GET /api/reviews  (Vercel serverless function)
 * Fetches Ascend Auto's Google rating + latest reviews from the Google Places API (New)
 * and returns a small JSON payload for the reviews section.
 *
 * Setup (Vercel project settings → Environment Variables):
 *   GOOGLE_PLACES_API_KEY  required; a key with "Places API (New)" enabled
 *   GOOGLE_PLACE_ID        optional; skips the one-off text search if set
 *
 * Responses are cached at Vercel's edge for 6 hours, so Google is called rarely.
 * Google returns at most 5 reviews per place; Google's attribution rules apply
 * (the page shows "Reviews from Google" and links each author).
 */
const QUERY = 'Ascend Auto, 16400 S IH 35 Frontage Rd, Buda, TX 78610';
const FIELDS = 'id,displayName,rating,userRatingCount,googleMapsUri,reviews';

module.exports = async (req, res) => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!key) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: 'not_configured' }));
  }
  try {
    let placeId = process.env.GOOGLE_PLACE_ID;
    if (!placeId) {
      const s = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.id' },
        body: JSON.stringify({ textQuery: QUERY, maxResultCount: 1 })
      });
      const sj = await s.json();
      placeId = sj.places && sj.places[0] && sj.places[0].id;
      if (!placeId) throw new Error('place_not_found');
    }
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS }
    });
    if (!r.ok) throw new Error('places_' + r.status);
    const p = await r.json();
    const body = {
      name: p.displayName && p.displayName.text,
      rating: p.rating || null,
      total: p.userRatingCount || 0,
      url: p.googleMapsUri || null,
      reviews: (p.reviews || []).map((v) => ({
        author: (v.authorAttribution && v.authorAttribution.displayName) || 'Google user',
        authorUrl: (v.authorAttribution && v.authorAttribution.uri) || null,
        photo: (v.authorAttribution && v.authorAttribution.photoUri) || null,
        rating: v.rating || 0,
        text: (v.text && v.text.text) || (v.originalText && v.originalText.text) || '',
        when: v.relativePublishTimeDescription || '',
        url: v.googleMapsUri || null
      }))
    };
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(JSON.stringify(body));
  } catch (e) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'upstream', detail: String(e.message || e) }));
  }
};
