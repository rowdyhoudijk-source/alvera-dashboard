// Stap 2: Shopify stuurt gebruiker terug met een code
// Wij wisselen die code in voor een echte access token
export default async function handler(req, res) {
  const { shop, code, state } = req.query;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!shop || !code) {
    return res.status(400).send('Missing shop or code');
  }

  try {
    // Wissel code in voor access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).send('Token ophalen mislukt: ' + JSON.stringify(tokenData));
    }

    // Stuur gebruiker terug naar dashboard met token in URL
    const dashboardUrl = `/alvera-dashboard.html?token=${tokenData.access_token}&shop=${shop.replace('.myshopify.com', '')}`;
    res.redirect(dashboardUrl);

  } catch (err) {
    res.status(500).send('Fout: ' + err.message);
  }
}
