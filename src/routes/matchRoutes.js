const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const users = require("../data/users");
const properties = require("../data/properties");
const { buildRoommateMatch } = require("../utils/matchmaking");

const router = express.Router();

router.use(authMiddleware);

router.get("/:propertyId", (req, res) => {
  const property = properties.find((item) => item.id === req.params.propertyId);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  const currentUser = users.find((item) => item.id === req.user.id);

  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const candidates = users
    .filter(
      (user) =>
        user.id !== currentUser.id && user.currentPropertyId === req.params.propertyId
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
