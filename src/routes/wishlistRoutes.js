const express = require("express");
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/authMiddleware");
const { serializeProperty, propertyInclude } = require("../utils/propertyView");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  const entries = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        include: propertyInclude,
      },
    },
  });

  const savedProperties = entries.map((entry) =>
    serializeProperty(entry.property, req.user)
  );

  res.json({
    data: savedProperties,
    total: savedProperties.length,
  });
});

router.post("/:propertyId", async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.propertyId },
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  const existingEntry = await prisma.wishlist.findUnique({
    where: {
      userId_propertyId: {
        userId: req.user.id,
        propertyId: property.id,
      },
    },
  });

  if (existingEntry) {
    return res.status(400).json({ message: "Property already saved" });
  }

  await prisma.wishlist.create({
    data: {
      userId: req.user.id,
      propertyId: property.id,
    },
  });

  const savedIds = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    select: { propertyId: true },
  });

  res.status(201).json({
    message: "Property saved successfully",
    savedIds: savedIds.map((entry) => entry.propertyId),
  });
});

router.delete("/:propertyId", async (req, res) => {
  const existingEntry = await prisma.wishlist.findUnique({
    where: {
      userId_propertyId: {
        userId: req.user.id,
        propertyId: req.params.propertyId,
      },
    },
  });

  if (!existingEntry) {
    return res.status(404).json({ message: "Property not found in wishlist" });
  }

  await prisma.wishlist.delete({
    where: {
      userId_propertyId: {
        userId: req.user.id,
        propertyId: req.params.propertyId,
      },
    },
  });

  const savedIds = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    select: { propertyId: true },
  });

  res.json({
    message: "Property removed successfully",
    savedIds: savedIds.map((entry) => entry.propertyId),
  });
});

module.exports = router;
