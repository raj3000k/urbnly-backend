const express = require("express");
const router = express.Router();
const properties = require("../data/properties");
const users = require("../data/users");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const enrichProperty = (property, viewer) => {
  const residents = users.filter((user) => user.currentPropertyId === property.id);
  const normalizedCompany = viewer?.company?.trim().toLowerCase();

  const colleagues = normalizedCompany
    ? residents.filter(
        (resident) =>
          resident.id !== viewer.id &&
          resident.company?.trim().toLowerCase() === normalizedCompany
      )
    : [];

  return {
    ...property,
    socialProof: {
      residentCount: residents.length,
      colleaguesCount: colleagues.length,
      companyName: viewer?.company || "",
      colleagueNames: colleagues.slice(0, 3).map((resident) => resident.name),
    },
  };
};

router.get("/", optionalAuthMiddleware, (req, res) => {
  const { search, budget, page = 1, limit = 5 } = req.query;

  let result = properties;

  // Search filter
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.location.toLowerCase().includes(s)
    );
  }

  // Budget filter
  if (budget) {
    result = result.filter((p) => p.price <= Number(budget));
  }

  // Pagination
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;

  const paginated = result.slice(start, end);

  res.json({
    data: paginated.map((property) => enrichProperty(property, req.user)),
    total: result.length,
    page: pageNum,
  });
});

router.get("/owner/listings", authMiddleware, (req, res) => {
  const ownerListings = properties.filter((property) => property.ownerId === req.user.id);

  res.json({
    data: ownerListings,
    total: ownerListings.length,
  });
});

router.post("/", authMiddleware, (req, res) => {
  const {
    title,
    location,
    price,
    image,
    images,
    distance,
    description,
    roomType,
    deposit,
    foodIncluded,
    highlights,
    amenities,
    houseRules,
  } = req.body;

  if (!title?.trim() || !location?.trim() || !description?.trim()) {
    return res
      .status(400)
      .json({ message: "Title, location, and description are required" });
  }

  const numericPrice = Number(price);
  const numericDeposit = Number(deposit);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ message: "Please provide a valid monthly price" });
  }

  if (!Number.isFinite(numericDeposit) || numericDeposit < 0) {
    return res.status(400).json({ message: "Please provide a valid deposit" });
  }

  const normalizedImages = Array.isArray(images)
    ? images.filter((item) => typeof item === "string" && item.trim())
    : [];

  const primaryImage =
    typeof image === "string" && image.trim()
      ? image.trim()
      : normalizedImages[0] ||
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";

  const newProperty = {
    id: Date.now().toString(),
    ownerId: req.user.id,
    title: title.trim(),
    location: location.trim(),
    price: numericPrice,
    image: primaryImage,
    images: normalizedImages.length ? normalizedImages : [primaryImage],
    available: true,
    verified: false,
    distance: typeof distance === "string" && distance.trim() ? distance.trim() : "TBD",
    description: description.trim(),
    roomType: typeof roomType === "string" && roomType.trim() ? roomType.trim() : "Flexible sharing",
    deposit: numericDeposit,
    foodIncluded: Boolean(foodIncluded),
    highlights: Array.isArray(highlights) ? highlights.filter(Boolean) : [],
    amenities: Array.isArray(amenities) ? amenities.filter(Boolean) : [],
    houseRules: Array.isArray(houseRules) ? houseRules.filter(Boolean) : [],
    owner: {
      name: req.user.name,
      phone: "Contact via dashboard",
      responseTime: "Usually replies within a few hours",
      role: "Owner",
    },
  };

  properties.unshift(newProperty);

  res.status(201).json({
    message: "Property added successfully",
    property: newProperty,
  });
});

router.patch("/:id/availability", authMiddleware, (req, res) => {
  const property = properties.find((item) => item.id === req.params.id);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (property.ownerId !== req.user.id) {
    return res.status(403).json({ message: "You can only manage your own listings" });
  }

  if (typeof req.body.available !== "boolean") {
    return res.status(400).json({ message: "Availability must be true or false" });
  }

  property.available = req.body.available;

  res.json({
    message: "Availability updated successfully",
    property,
  });
});

router.get("/:id", optionalAuthMiddleware, (req, res) => {
  const property = properties.find((p) => p.id === req.params.id);

  if (!property) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(enrichProperty(property, req.user));
});

module.exports = router;
