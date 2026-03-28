const express = require("express");
const router = express.Router();
const properties = require("../data/properties");

router.get("/", (req, res) => {
  res.json(properties);
});

router.get("/:id", (req, res) => {
  const property = properties.find((p) => p.id === req.params.id);

  if (!property) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(property);
});

module.exports = router;
