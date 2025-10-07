import jwt from "jsonwebtoken";

// Middleware to verify JWT from Authorization header (Bearer token) or ?token query
export function authenticateJWT(req, res, next) {
  // Prefer token from HttpOnly cookie for security
  let token = req.cookies && req.cookies.token;

  // Fallbacks: Authorization header or ?token query param
  if (!token) {
    const authHeader = req.headers.authorization || null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }
  }

  if (!token) {
    return handleRedirect(req, res, 401, "Authentication required");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    res.locals.user = payload;
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return handleRedirect(req, res, 401, "Invalid or expired token");
  }
}

// Role-based guard: call as requireRole('admin') or requireRole('customer')
export function requireRole(role) {
  return function (req, res, next) {
    const user = req.user || res.locals.user;
    if (!user) {
      return handleRedirect(req, res, 401, "Authentication required");
    }

    if (user.role !== role) {
      return handleRedirect(req, res, 403, "Access denied");
    }

    next();
  };
}

// Helper function to handle redirects and responses
function handleRedirect(req, res, statusCode, message) {
  if (req.accepts("html")) {
    if (statusCode === 401) {
      return res.redirect("/login");
    } else if (statusCode === 403) {
      return res.status(403).send(message); // You can customize this message or redirect to an error page
    }
  }
  return res.status(statusCode).json({ msg: message });
}
