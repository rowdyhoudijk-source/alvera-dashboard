export default async function handler(req, res) {
  const { code, state } = req.query;
  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const redirectUri = 'https://alvera-dashboard.vercel.app/api/meta-callback';

  if (!code) {
    return res.status(400).send('Geen code ontvangen van Facebook');
  }

  try {
    // Stap 1: Wissel code in voor short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    // Stap 2: Wissel short-lived in voor long-lived token (60 dagen)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    if (longData.error) throw new Error(longData.error.message);

    const longToken = longData.access_token;
    const expiresIn = longData.expires_in || 5184000; // 60 dagen default
    const expiresAt = Date.now() + (expiresIn * 1000);

    // Stuur terug naar dashboard met token
    res.redirect(`/alvera-dashboard.html?meta_token=${longToken}&meta_expires=${expiresAt}`);

  } catch (err) {
    res.status(500).send('Meta koppeling mislukt: ' + err.message);
  }
}
