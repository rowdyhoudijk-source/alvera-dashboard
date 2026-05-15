export default async function handler(req, res) {
  const { shop } = req.query;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  
  if (!shop || !clientId) {
    return res.status(400).send('Missing parameters');
  }

  const scopes = 'read_analytics,read_customers,read_fulfillments,read_inventory,read_orders,read_product_feeds,read_product_listings,read_products,read_reports,read_shopify_payments_disputes,read_themes';
  const redirectUri = `https://alvera-dashboard.vercel.app/api/callback`;
  const state = Math.random().toString(36).substring(2);
  
  res.setHeader('Set-Cookie', `shopify_state=${state}; Path=/; HttpOnly; SameSite=Lax`);
  
  const authUrl = `https://${shop}.myshopify.com/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  res.redirect(authUrl);
}
