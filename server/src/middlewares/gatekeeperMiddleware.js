/**
 * Gatekeeper middleware to restrict access to sensitive routes (like API documentation).
 * Uses a password from headers, query parameters, or a session cookie.
 */
export const gatekeeper = (req, res, next) => {
  // Extract cookie manually since cookie-parser might not be installed
  const cookies = req.headers.cookie || '';
  const gatekeeperCookie = cookies
    .split('; ')
    .find(row => row.startsWith('gatekeeper_token='))
    ?.split('=')[1];

  const providedPassword = req.headers['x-gatekeeper-password'] || req.query.password || gatekeeperCookie;
  const SWAGGER_PASSWORD = process.env.SWAGGER_PASSWORD || 'kindheart-docs-2026';

  if (providedPassword === SWAGGER_PASSWORD) {
    // If password was in query, set a cookie for subsequent asset requests (JS/CSS)
    if (req.query.password) {
      res.setHeader('Set-Cookie', `gatekeeper_token=${SWAGGER_PASSWORD}; Path=/api-docs; HttpOnly; SameSite=Lax`);
    }
    return next();
  }

  // If unauthorized, provide a simple hint or just block
  res.status(401).send(`
    <html>
      <head>
        <title>401 Unauthorized - KindHeart Gatekeeper</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #f8f9fa; margin: 0; color: #212529;">
        <div style="background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
          <h1 style="color: #dc3545; margin: 0 0 1rem; font-size: 1.5rem;">Access Denied</h1>
          <p style="margin-bottom: 1.5rem; line-height: 1.5; color: #6c757d;">This documentation is protected by the KindHeart Gatekeeper.</p>
          <p style="font-size: 0.875rem; color: #adb5bd;">Please contact the admin for the correct password.</p>
        </div>
      </body>
    </html>
  `);
};
