const express = require("express");
const wishlists = require("../data/wishlists");
const properties = require("../data/properties");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", (req, res) => {
  const wishlistIds = wishlists[req.user.id] || [];
  const savedProperties = wishlistIds
    .map((id) => properties.find((property) => property.id === id))
    .filter(Boolean);

  res.json({
    data: savedProperties,
    total: savedProperties.length,
  });
});

router.post("/:propertyId", (req, res) => {
  const property = properties.find((item) => item.id === req.params.propertyId);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  const currentWishlist = wishlists[req.user.id] || [];

  if (currentWishlist.includes(property.id)) {
    return res.status(400).json({ message: "Property already saved" });
  }

  wishlists[req.user.id] = [...currentWishlist, property.id];

  res.status(201).json({
    message: "Property saved successfully",
    savedIds: wishlists[req.user.id],
  });
});

router.delete("/:propertyId", (req, res) => {
  const currentWishlist = wishlists[req.user.id] || [];

  if (!currentWishlist.includes(req.params.propertyId)) {
    return res.status(404).json({ message: "Property not found in wishlist" });
  }

  wishlists[req.user.id] = currentWishlist.filter(
    (id) => id !== req.params.propertyId
  );

  res.json({
    message: "Property removed successfully",
    savedIds: wishlists[req.user.id],
  });
});

module.exports = router;
