export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { shop, clientId, clientSecret, endpoint } = req.query;

  if (!shop || !clientId || !clientSecret || !endpoint) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const tokenRes = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }).toString()
    });

    const tokenText = await tokenRes.text();
    
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch(e) {
      return res.status(500).json({ 
        error: `Token fout (${tokenRes.status}): ${tokenText.substring(0, 300)}` 
      });
    }

    if (!tokenData.access_token) {
      return res.status(401).json({ 
        error: `Geen token: ${JSON.stringify(tokenData)}` 
      });
    }

    const apiUrl = `https://${shop}.myshopify.com/admin/api/2026-04/${endpoint}`;
    const apiRes = await fetch(apiUrl, {
      headers: { 
        'X-Shopify-Access-Token': tokenData.access_token,
        'Accept': 'application/json'
      }
    });

    const apiText = await apiRes.text();
    let apiData;
    try {
      apiData = JSON.parse(apiText);
    } catch(e) {
      return res.status(500).json({ error: `API parse fout: ${apiText.substring(0, 300)}` });
    }

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `API fout ${apiRes.status}`, details: apiData });
    }

    return res.status(200).json(apiData);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
