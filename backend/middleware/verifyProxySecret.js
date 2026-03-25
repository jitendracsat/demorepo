// Middleware: Validates X-Proxy-Secret header against env variable
const verifyProxySecret = (req, res, next) => {
  const secret = req.headers['x-proxy-secret'];
  const expectedSecret = process.env.PROXY_SECRET;

  if (!expectedSecret) {
    console.error('❌ PROXY_SECRET not set in environment variables');
    return res.status(500).json({ success: false, message: 'Server misconfiguration' });
  }

  if (!secret || secret !== expectedSecret) {
    console.warn('⚠️ Unauthorized sync attempt — invalid X-Proxy-Secret');
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid proxy secret' });
  }

  next();
};

export default verifyProxySecret;
