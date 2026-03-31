const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const SECRET = process.env.JWT_SECRET || "urbanly_secret";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid token user" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company || "",
      currentPropertyId: user.currentPropertyId || "",
      lookingForRoommate: Boolean(user.lookingForRoommate),
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
