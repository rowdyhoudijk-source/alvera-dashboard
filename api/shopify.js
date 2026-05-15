export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { shop, token, type, since } = req.query;

  if (!shop || !token || !type) {
    return res.status(400).json({ error: 'Missing: shop, token, type' });
  }

  const queries = {
    orders: `{
      orders(first: 250, query: "created_at:>=${since || '2024-01-01'}") {
        edges {
          node {
            id name createdAt displayFinancialStatus
            totalPriceSet { shopMoney { amount } }
            lineItems(first: 20) {
              edges { node { quantity product { id title legacyResourceId } } }
            }
          }
        }
      }
    }`,
    products: `{
      products(first: 250) {
        edges {
          node {
            id title legacyResourceId
            variants(first: 5) { edges { node { id title } } }
          }
        }
      }
    }`
  };

  const query = queries[type];
  if (!query) return res.status(400).json({ error: `Onbekend type: ${type}` });

  try {
    const apiRes = await fetch(`https://${shop}.myshopify.com/admin/api/2025-10/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const text = await apiRes.text();
    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(500).json({ error: `Parse fout: ${text.substring(0, 300)}` }); }

    if (!apiRes.ok) return res.status(apiRes.status).json({ error: `API fout ${apiRes.status}`, details: data });
    if (data.errors) return res.status(403).json({ error: 'GraphQL fout', details: data.errors });

    return res.status(200).json(data.data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
