const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const authMiddleware = require("../middleware/authMiddleware");
const bookings = require("../data/bookings");
const properties = require("../data/properties");

const TOKEN_AMOUNT_PAISE = 99900;
const CURRENCY = "INR";

const router = express.Router();

router.use(authMiddleware);

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

router.post("/create-order", async (req, res) => {
  const { propertyId } = req.body;
  const property = properties.find((item) => item.id === propertyId);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (!property.available) {
    return res.status(400).json({ message: "This property is currently unavailable" });
  }

  const booking = {
    id: `booking_${Date.now()}`,
    userId: req.user.id,
    propertyId: property.id,
    amount: TOKEN_AMOUNT_PAISE,
    currency: CURRENCY,
    status: "created",
    provider: "demo",
    paymentOrderId: null,
    paymentId: null,
    createdAt: new Date().toISOString(),
  };

  const razorpay = getRazorpayClient();

  if (razorpay) {
    const order = await razorpay.orders.create({
      amount: TOKEN_AMOUNT_PAISE,
      currency: CURRENCY,
      receipt: booking.id,
      notes: {
        bookingId: booking.id,
        propertyId: property.id,
        userId: req.user.id,
      },
    });

    booking.provider = "razorpay";
    booking.paymentOrderId = order.id;
    bookings.push(booking);

    return res.status(201).json({
      provider: "razorpay",
      keyId: process.env.RAZORPAY_KEY_ID,
      booking,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      property: {
        id: property.id,
        title: property.title,
      },
    });
  }

  booking.paymentOrderId = `demo_order_${booking.id}`;
  bookings.push(booking);

  return res.status(201).json({
    provider: "demo",
    booking,
    order: {
      id: booking.paymentOrderId,
      amount: booking.amount,
      currency: booking.currency,
    },
    property: {
      id: property.id,
      title: property.title,
    },
    message:
      "Razorpay keys are not configured, so the app is using demo booking mode.",
  });
});

router.post("/confirm", (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const booking = bookings.find(
    (item) => item.id === bookingId && item.userId === req.user.id
  );

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.provider === "razorpay") {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Incomplete Razorpay payment details" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    booking.status = "confirmed";
    booking.paymentOrderId = razorpay_order_id;
    booking.paymentId = razorpay_payment_id;
  } else {
    booking.status = "confirmed";
    booking.paymentId = razorpay_payment_id || `demo_payment_${booking.id}`;
  }

  res.json({
    message: "Booking confirmed successfully",
    booking,
  });
});

router.get("/my", (req, res) => {
  const userBookings = bookings
    .filter((booking) => booking.userId === req.user.id)
    .map((booking) => ({
      ...booking,
      property: properties.find((property) => property.id === booking.propertyId) || null,
    }));

  res.json({
    data: userBookings,
    total: userBookings.length,
  });
});

module.exports = router;
