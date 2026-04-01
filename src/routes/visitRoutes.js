const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const prisma = require("../lib/prisma");
const { serializeProperty, propertyInclude } = require("../utils/propertyView");

const router = express.Router();

router.use(authMiddleware);

const allowedStatuses = new Set(["pending", "confirmed", "completed", "cancelled"]);

function serializeVisit(visit, currentUser) {
  return {
    id: visit.id,
    scheduledFor: visit.scheduledFor,
    status: visit.status,
    phone: visit.phone,
    notes: visit.notes || "",
    createdAt: visit.createdAt,
    property: visit.property ? serializeProperty(visit.property, currentUser) : null,
  };
}

router.post("/", requireRole("customer"), async (req, res) => {
  const { propertyId, scheduledFor, phone, notes } = req.body;

  if (!propertyId?.trim()) {
    return res.status(400).json({ message: "Property is required" });
  }

  if (!phone?.trim()) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const visitDate = new Date(scheduledFor);

  if (Number.isNaN(visitDate.getTime())) {
    return res.status(400).json({ message: "Please choose a valid visit time" });
  }

  if (visitDate <= new Date()) {
    return res.status(400).json({ message: "Visit time must be in the future" });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId.trim() },
    select: { id: true, available: true },
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (!property.available) {
    return res.status(400).json({ message: "This property is not open for visits right now" });
  }

  const visit = await prisma.visit.create({
    data: {
      userId: req.user.id,
      propertyId: property.id,
      scheduledFor: visitDate,
      phone: phone.trim(),
      notes: typeof notes === "string" ? notes.trim() : "",
    },
    include: {
      property: {
        include: propertyInclude,
      },
    },
  });

  res.status(201).json({
    message: "Visit scheduled successfully",
    visit: serializeVisit(visit, req.user),
  });
});

router.get("/my", requireRole("customer"), async (req, res) => {
  const visits = await prisma.visit.findMany({
    where: { userId: req.user.id },
    orderBy: { scheduledFor: "asc" },
    include: {
      property: {
        include: propertyInclude,
      },
    },
  });

  res.json({
    data: visits.map((visit) => serializeVisit(visit, req.user)),
    total: visits.length,
  });
});

router.get("/owner", requireRole("owner"), async (req, res) => {
  const visits = await prisma.visit.findMany({
    where: {
      property: {
        ownerId: req.user.id,
      },
    },
    orderBy: [{ status: "asc" }, { scheduledFor: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          image: true,
        },
      },
    },
  });

  res.json({
    data: visits.map((visit) => ({
      id: visit.id,
      scheduledFor: visit.scheduledFor,
      status: visit.status,
      phone: visit.phone,
      notes: visit.notes || "",
      createdAt: visit.createdAt,
      property: visit.property,
      visitor: visit.user,
    })),
    total: visits.length,
  });
});

router.patch("/:id/status", requireRole("owner"), async (req, res) => {
  const { status } = req.body;

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: "Please choose a valid visit status" });
  }

  const visit = await prisma.visit.findUnique({
    where: { id: req.params.id },
    include: {
      property: {
        select: {
          ownerId: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
    },
  });

  if (!visit) {
    return res.status(404).json({ message: "Visit not found" });
  }

  if (visit.property.ownerId !== req.user.id) {
    return res.status(403).json({ message: "You can only manage visits for your own listings" });
  }

  const updatedVisit = await prisma.visit.update({
    where: { id: visit.id },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          image: true,
        },
      },
    },
  });

  res.json({
    message: "Visit updated successfully",
    visit: {
      id: updatedVisit.id,
      scheduledFor: updatedVisit.scheduledFor,
      status: updatedVisit.status,
      phone: updatedVisit.phone,
      notes: updatedVisit.notes || "",
      createdAt: updatedVisit.createdAt,
      property: updatedVisit.property,
      visitor: updatedVisit.user,
    },
  });
});

module.exports = router;
