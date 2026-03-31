const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const SECRET = process.env.JWT_SECRET || "urbanly_secret";

async function optionalAuthMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company || "",
        currentPropertyId: user.currentPropertyId || "",
        lookingForRoommate: Boolean(user.lookingForRoommate),
      };
    }
  } catch {
    // Ignore invalid tokens on optional routes and continue as a guest.
  }

  return next();
}

module.exports = optionalAuthMiddleware;
