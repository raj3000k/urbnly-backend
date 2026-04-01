const { getRequiredEnv } = require("./env");

const JWT_SECRET = getRequiredEnv("JWT_SECRET");

module.exports = {
  JWT_SECRET,
};
