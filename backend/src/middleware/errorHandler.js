export function notFoundHandler(req, res) {
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err?.name === "ZodError") {
    const issues = err.issues || [];
    const errors = issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return res.status(400).json({
      message: errors[0]?.message || "Validation failed",
      errors,
    });
  }
  console.error(err?.stack || err?.message || err);
  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
}
