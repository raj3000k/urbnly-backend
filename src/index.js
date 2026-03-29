const express = require("express");
const cors = require("cors");
const propertyRoutes = require("./routes/propertyRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("URBNLY API Running");
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
