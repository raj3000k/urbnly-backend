require("dotenv").config();

const express = require("express");
const cors = require("cors");
const propertyRoutes = require("./routes/propertyRoutes");
const authRoutes = require("./routes/authRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const commuteRoutes = require("./routes/commuteRoutes");
const placesRoutes = require("./routes/placesRoutes");
const matchRoutes = require("./routes/matchRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/commute", commuteRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/matches", matchRoutes);

app.get("/", (req, res) => {
  res.send("URBNLY API Running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
