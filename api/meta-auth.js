export default async function handler(req, res) {
  const clientId = process.env.META_APP_ID;
  const redirectUri = 'https://alvera-dashboard.vercel.app/api/meta-callback';
  const scope = 'ads_read';
  const state = Math.random().toString(36).substring(2);
  
  res.setHeader('Set-Cookie', `meta_state=${state}; Path=/; HttpOnly; SameSite=Lax`);
  
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`;
  
  res.redirect(authUrl);
}
