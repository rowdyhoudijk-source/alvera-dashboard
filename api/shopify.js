export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { shop, clientId, clientSecret, endpoint } = req.query;

  if (!shop || !clientId || !clientSecret) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const tokenRes = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }).toString()
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      return res.status(tokenRes.status).json({ error: `Token fout: ${txt}` });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const apiUrl = `https://${shop}.myshopify.com/admin/api/2026-04/${endpoint}`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `API fout: ${apiRes.status}` });
    }

    const data = await apiRes.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
