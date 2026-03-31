const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const prisma = require("../lib/prisma");
const { serializeProperty, propertyInclude } = require("../utils/propertyView");

const router = express.Router();

router.use(authMiddleware);

router.post("/create-order", async (req, res) => {
  return res.status(503).json({
    message:
      "Online token payments are coming soon. You can still shortlist the property and contact the owner.",
  });
});

router.post("/confirm", async (_req, res) => {
  return res.status(503).json({
    message: "Online token payments are coming soon.",
  });
});

router.get("/my", async (req, res) => {
  const userBookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        include: propertyInclude,
      },
    },
  });

  res.json({
    data: userBookings.map((booking) => ({
      ...booking,
      property: booking.property ? serializeProperty(booking.property, req.user) : null,
    })),
    total: userBookings.length,
  });
});

module.exports = router;
