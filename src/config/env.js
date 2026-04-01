function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function getAllowedOrigins() {
  const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174,http://localhost:5175";

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = {
  getAllowedOrigins,
  getRequiredEnv,
};
