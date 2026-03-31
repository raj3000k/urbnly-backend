const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const prisma = require("../lib/prisma");
const { buildRoommateMatch } = require("../utils/matchmaking");

const router = express.Router();

router.use(authMiddleware);

router.get("/:propertyId", async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.propertyId },
    select: { id: true, title: true, location: true },
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!currentUser.lookingForRoommate || property.capacity <= 1) {
    return res.json({
      property: {
        id: property.id,
        title: property.title,
        location: property.location,
      },
      data: [],
      total: 0,
    });
  }

  const candidates = (
    await prisma.user.findMany({
      where: {
        currentPropertyId: req.params.propertyId,
        lookingForRoommate: true,
        NOT: {
          id: currentUser.id,
        },
      },
    })
  )
    .map((candidate) => buildRoommateMatch(currentUser, candidate))
    .sort((left, right) => right.score - left.score);

  res.json({
    property: {
      id: property.id,
      title: property.title,
      location: property.location,
    },
    data: candidates,
    total: candidates.length,
  });
});

module.exports = router;
