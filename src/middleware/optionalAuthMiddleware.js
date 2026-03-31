const jwt = require("jsonwebtoken");
const users = require("../data/users");

const SECRET = process.env.JWT_SECRET || "urbanly_secret";

function optionalAuthMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = users.find((item) => item.id === decoded.id);

    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company || "",
        currentPropertyId: user.currentPropertyId || "",
      };
    }
  } catch {
    // Ignore invalid tokens on optional routes and continue as a guest.
  }

  next();
}

module.exports = optionalAuthMiddleware;
