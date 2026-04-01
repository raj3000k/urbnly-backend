function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;

    console.log(
      JSON.stringify({
        level: "info",
        type: "request",
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
        userAgent: req.get("user-agent") || "unknown",
        timestamp: new Date().toISOString(),
      })
    );
  });

  next();
}

module.exports = requestLogger;
