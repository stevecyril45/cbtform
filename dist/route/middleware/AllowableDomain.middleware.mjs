import dotenv from "dotenv";
dotenv.config();

const ALLOWED_DEV_DOMAINS = [
  'http://localhost:5000',
];

const ALLOWED_PROD_DOMAINS = [];

const isDev = process.env.DEV === 'true';
const ALLOWED_DOMAINS = isDev ? ALLOWED_DEV_DOMAINS : ALLOWED_PROD_DOMAINS;

export default async function allowableDomainMiddleware(req, res, next) {
  let origin = req.get('origin');
  // console.log('New Request From Origin:', origin);

  // Collect client_device_* headers from Access-Control-Request-Headers
  let allowedHeaders = ['Content-Type', 'Authorization', 'auth'];
  if (req.get('Access-Control-Request-Headers')) {
    const requestHeaders = req.get('Access-Control-Request-Headers').split(',').map(h => h.trim());
    requestHeaders.forEach(header => {
      if (header.startsWith('client_device_')) {
        allowedHeaders.push(header);
      }
    });
  }

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    console.log('Handling OPTIONS request for:', origin || '*');
    return res.status(200).end();
  }

  // Fallback to Referer header if Origin is undefined
  if (!origin) {
    const referer = req.get('referer');
    if (referer) {
      try {
        const match = referer.match(/^(https?:\/\/[^/]+)/);
        if (match) {
          origin = match[1];
          // console.log('Referer-derived origin:', origin);
        } else {
          // console.log('Invalid Referer header:', referer);
          origin = '*';
        }
      } catch (error) {
        // console.error('Referer parsing error:', error);
        origin = '*';
      }
    } else {
      // console.log('No Origin or Referer header, allowing non-browser client');
      origin = '*';
    }
  }

  // Check if the origin is in ALLOWED_DOMAINS (skip for non-browser clients)
  if (origin !== '*' && !ALLOWED_DOMAINS.includes(origin)) {
    // console.log('Forbidden: Origin not allowed:', origin);
    return res.status(403).json({ error: 'Forbidden: Origin not allowed' });
  }

  // Set CORS headers for valid origins
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','));
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // console.log('CORS headers set for origin:', origin);

  try {
    // Create auth object
    const auth = {};
    auth.email = req.get('auth') || 'GUEST';
    for (const header in req.headers) {
      if (header.startsWith('client_device_')) {
        auth[header] = req.headers[header];
      }
    }
    req.auth = auth;

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
