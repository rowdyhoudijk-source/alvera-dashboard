// Stap 1: Start OAuth flow - stuur gebruiker naar Shopify
export default async function handler(req, res) {
  const { shop, clientId, redirectUri } = req.query;
  
  if (!shop || !clientId || !redirectUri) {
    return res.status(400).send('Missing parameters');
  }

  const scopes = 'read_orders,read_products';
  const state = Math.random().toString(36).substring(2);
  
  // Sla state op in cookie voor verificatie
  res.setHeader('Set-Cookie', `shopify_state=${state}; Path=/; HttpOnly; SameSite=Lax`);
  
  const authUrl = `https://${shop}.myshopify.com/admin/oauth/authorize?` +
    `client_id=${clientId}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`;
  
  res.redirect(authUrl);
}
