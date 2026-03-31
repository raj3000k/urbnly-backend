const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const { serializeProperty, propertyInclude } = require("../utils/propertyView");

router.get("/", optionalAuthMiddleware, async (req, res) => {
  const { search, budget, page = 1, limit = 5 } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = {};

  // Search filter
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  // Budget filter
  if (budget) {
    where.price = { lte: Number(budget) };
  }

  const [result, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: propertyInclude,
    }),
    prisma.property.count({ where }),
  ]);

  res.json({
    data: result.map((property) => serializeProperty(property, req.user)),
    total,
    page: pageNum,
  });
});

router.get("/owner/listings", authMiddleware, async (req, res) => {
  const ownerListings = await prisma.property.findMany({
    where: { ownerId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: propertyInclude,
  });

  res.json({
    data: ownerListings.map((property) => serializeProperty(property, req.user)),
    total: ownerListings.length,
  });
});

router.post("/", authMiddleware, async (req, res) => {
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

  const newProperty = await prisma.property.create({
    data: {
      ownerId: req.user.id,
      title: title.trim(),
      location: location.trim(),
      price: numericPrice,
      image: primaryImage,
      images: normalizedImages.length ? normalizedImages : [primaryImage],
      available: true,
      verified: false,
      distance:
        typeof distance === "string" && distance.trim() ? distance.trim() : "TBD",
      description: description.trim(),
      roomType:
        typeof roomType === "string" && roomType.trim()
          ? roomType.trim()
          : "Flexible sharing",
      deposit: numericDeposit,
      foodIncluded: Boolean(foodIncluded),
      highlights: Array.isArray(highlights) ? highlights.filter(Boolean) : [],
      amenities: Array.isArray(amenities) ? amenities.filter(Boolean) : [],
      houseRules: Array.isArray(houseRules) ? houseRules.filter(Boolean) : [],
      ownerPhone: "Contact via dashboard",
      ownerResponseTime: "Usually replies within a few hours",
      ownerRole: "Owner",
    },
    include: propertyInclude,
  });

  res.status(201).json({
    message: "Property added successfully",
    property: serializeProperty(newProperty, req.user),
  });
});

router.patch("/:id/availability", authMiddleware, async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: propertyInclude,
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (property.ownerId !== req.user.id) {
    return res.status(403).json({ message: "You can only manage your own listings" });
  }

  if (typeof req.body.available !== "boolean") {
    return res.status(400).json({ message: "Availability must be true or false" });
  }

  const updatedProperty = await prisma.property.update({
    where: { id: property.id },
    data: { available: req.body.available },
    include: propertyInclude,
  });

  res.json({
    message: "Availability updated successfully",
    property: serializeProperty(updatedProperty, req.user),
  });
});

router.get("/:id", optionalAuthMiddleware, async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: propertyInclude,
  });

  if (!property) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(serializeProperty(property, req.user));
});

module.exports = router;
