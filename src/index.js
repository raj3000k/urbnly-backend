require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { getAllowedOrigins } = require("./config/env");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const propertyRoutes = require("./routes/propertyRoutes");
const authRoutes = require("./routes/authRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const commuteRoutes = require("./routes/commuteRoutes");
const placesRoutes = require("./routes/placesRoutes");
const matchRoutes = require("./routes/matchRoutes");
const visitRoutes = require("./routes/visitRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = getAllowedOrigins();

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error("Request blocked by CORS policy");
      error.statusCode = 403;
      callback(error);
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "urbnly-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/commute", commuteRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/visits", visitRoutes);

app.get("/", (req, res) => {
  res.send("URBNLY API Running");
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
