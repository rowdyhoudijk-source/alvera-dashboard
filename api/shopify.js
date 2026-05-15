export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { shop, token, endpoint } = req.query;

  if (!shop || !token || !endpoint) {
    return res.status(400).json({ error: 'Missing: shop, token, endpoint' });
  }

  try {
    const apiUrl = `https://${shop}.myshopify.com/admin/api/2025-10/${endpoint}`;
    
    const apiRes = await fetch(apiUrl, {
      headers: { 
        'X-Shopify-Access-Token': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const apiText = await apiRes.text();
    
    let apiData;
    try {
      apiData = JSON.parse(apiText);
    } catch(e) {
      return res.status(500).json({ error: `Parse fout (${apiRes.status}): ${apiText.substring(0, 500)}` });
    }

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ 
        error: `Shopify API fout ${apiRes.status}`, 
        details: apiData,
        url: apiUrl
      });
    }

    return res.status(200).json(apiData);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
