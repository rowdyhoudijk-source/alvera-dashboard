export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { shop, clientId, clientSecret, type } = req.query;

  if (!shop || !clientId || !clientSecret || !type) {
    return res.status(400).json({ error: 'Missing: shop, clientId, clientSecret, type' });
  }

  try {
    // Stap 1: Token ophalen via client credentials
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
    try { tokenData = JSON.parse(tokenText); } 
    catch(e) { return res.status(500).json({ error: `Token parse fout: ${tokenText.substring(0,300)}` }); }

    if (!tokenData.access_token) {
      return res.status(401).json({ error: `Geen token: ${JSON.stringify(tokenData)}` });
    }

    const accessToken = tokenData.access_token;

    // Stap 2: GraphQL query uitvoeren
    const queries = {
      orders: (since) => `{
        orders(first: 250, query: "created_at:>=${since}") {
          edges {
            node {
              id name createdAt displayFinancialStatus
              totalPriceSet { shopMoney { amount } }
              lineItems(first: 20) {
                edges { node { quantity product { id title } } }
              }
            }
          }
        }
      }`,
      products: () => `{
        products(first: 250) {
          edges {
            node {
              id title
              variants(first: 10) { edges { node { id title } } }
            }
          }
        }
      }`
    };

    const queryFn = queries[type];
    if (!queryFn) return res.status(400).json({ error: `Onbekend type: ${type}` });

    const query = queryFn(req.query.since || '2024-01-01');

    const apiRes = await fetch(`https://${shop}.myshopify.com/admin/api/2025-10/graphql.json`, {
      method: 'POST',
      headers: { 
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const apiText = await apiRes.text();
    let apiData;
    try { apiData = JSON.parse(apiText); }
    catch(e) { return res.status(500).json({ error: `API parse fout: ${apiText.substring(0,300)}` }); }

    if (!apiRes.ok) return res.status(apiRes.status).json({ error: `API fout ${apiRes.status}`, details: apiData });
    if (apiData.errors) return res.status(403).json({ error: 'GraphQL fout', details: apiData.errors });

    return res.status(200).json(apiData.data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
