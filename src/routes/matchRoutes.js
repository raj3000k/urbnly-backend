const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const prisma = require("../lib/prisma");
const { buildRoommateMatch } = require("../utils/matchmaking");
const { sendRoommateInterestEmail } = require("../services/notificationEmails");

const router = express.Router();

router.use(authMiddleware);

const allowedInterestStatuses = new Set(["accepted", "declined"]);

const serializeInterest = (interest, currentUserId) => ({
  id: interest.id,
  status: interest.status,
  message: interest.message || "",
  createdAt: interest.createdAt,
  updatedAt: interest.updatedAt,
  direction: interest.requesterId === currentUserId ? "sent" : "received",
  property: {
    id: interest.property.id,
    title: interest.property.title,
    location: interest.property.location,
    image: interest.property.image,
  },
  requester: {
    id: interest.requester.id,
    name: interest.requester.name,
    company: interest.requester.company || "",
    email: interest.requester.email,
  },
  recipient: {
    id: interest.recipient.id,
    name: interest.recipient.name,
    company: interest.recipient.company || "",
    email: interest.recipient.email,
  },
});

const interestInclude = {
  requester: {
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
    },
  },
  recipient: {
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
};

router.get("/interests", requireRole("customer"), async (req, res) => {
  const interests = await prisma.roommateInterest.findMany({
    where: {
      OR: [{ requesterId: req.user.id }, { recipientId: req.user.id }],
    },
    orderBy: { updatedAt: "desc" },
    include: interestInclude,
  });

  res.json({
    data: interests.map((interest) => serializeInterest(interest, req.user.id)),
    total: interests.length,
  });
});

router.patch("/interests/:id", requireRole("customer"), async (req, res) => {
  const { status } = req.body;

  if (!allowedInterestStatuses.has(status)) {
    return res.status(400).json({ message: "Please choose accept or decline" });
  }

  const interest = await prisma.roommateInterest.findUnique({
    where: { id: req.params.id },
    include: interestInclude,
  });

  if (!interest) {
    return res.status(404).json({ message: "Roommate request not found" });
  }

  if (interest.recipientId !== req.user.id) {
    return res.status(403).json({ message: "You can only respond to requests sent to you" });
  }

  const updatedInterest = await prisma.roommateInterest.update({
    where: { id: interest.id },
    data: { status },
    include: interestInclude,
  });

  res.json({
    message:
      status === "accepted"
        ? "Roommate request accepted"
        : "Roommate request declined",
    interest: serializeInterest(updatedInterest, req.user.id),
  });
});

router.post("/:propertyId/interest", requireRole("customer"), async (req, res) => {
  const { recipientId, message } = req.body;

  if (!recipientId?.trim()) {
    return res.status(400).json({ message: "Please choose a roommate" });
  }

  if (recipientId === req.user.id) {
    return res.status(400).json({ message: "You cannot send a request to yourself" });
  }

  const [property, requester, recipient] = await Promise.all([
    prisma.property.findUnique({
      where: { id: req.params.propertyId },
      select: { id: true, title: true, location: true, image: true },
    }),
    prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, company: true },
    }),
    prisma.user.findUnique({
      where: { id: recipientId.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        currentPropertyId: true,
        lookingForRoommate: true,
      },
    }),
  ]);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (!requester || !recipient) {
    return res.status(404).json({ message: "Roommate not found" });
  }

  if (
    recipient.currentPropertyId !== property.id ||
    !recipient.lookingForRoommate
  ) {
    return res.status(400).json({
      message: "This roommate is not currently open to requests for this property",
    });
  }

  const normalizedMessage =
    typeof message === "string" && message.trim() ? message.trim().slice(0, 300) : "";

  const interest = await prisma.roommateInterest.upsert({
    where: {
      requesterId_recipientId_propertyId: {
        requesterId: req.user.id,
        recipientId: recipient.id,
        propertyId: property.id,
      },
    },
    create: {
      requesterId: req.user.id,
      recipientId: recipient.id,
      propertyId: property.id,
      status: "pending",
      message: normalizedMessage,
    },
    update: {
      status: "pending",
      message: normalizedMessage,
    },
    include: interestInclude,
  });

  sendRoommateInterestEmail({
    interest,
    requester,
    recipient,
    property,
  }).catch((error) => {
    console.error("Failed to send roommate interest email", error);
  });

  res.status(201).json({
    message: "Roommate interest sent",
    interest: serializeInterest(interest, req.user.id),
  });
});

router.get("/:propertyId", async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.propertyId },
    select: { id: true, title: true, location: true, capacity: true },
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
