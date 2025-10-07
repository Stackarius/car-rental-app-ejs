// middleware.js
// Simple middleware to expose the current request path to EJS views
export default function setCurrentPath(req, res, next) {
  // res.locals is the recommended place to put view-level variables
  res.locals.currentPath = req.path || req.originalUrl || "/";
  next();
}
