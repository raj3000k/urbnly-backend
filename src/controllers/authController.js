const users = require("../data/users");
const properties = require("../data/properties");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  emptyPreferences,
  normalizePreferences,
} = require("../utils/matchmaking");

const SECRET = process.env.JWT_SECRET || "urbanly_secret";

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  company: user.company || "",
  currentPropertyId: user.currentPropertyId || "",
  preferences: normalizePreferences(user.preferences),
});

exports.register = async (req, res) => {
  const { name, email, password, company } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedCompany = typeof company === "string" ? company.trim() : "";

  if (!name?.trim() || !normalizedEmail || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  const existingUser = users.find((u) => u.email === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    email: normalizedEmail,
    company: normalizedCompany,
    currentPropertyId: "",
    preferences: emptyPreferences(),
    password: hashedPassword,
  };

  users.push(newUser);

  const token = jwt.sign({ id: newUser.id }, SECRET, { expiresIn: "7d" });

  res.status(201).json({
    message: "User registered successfully",
    token,
    user: serializeUser(newUser),
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });

  res.json({
    token,
    user: serializeUser(user),
  });
};

exports.getMe = (req, res) => {
  const user = users.find((item) => item.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    user: serializeUser(user),
  });
};

exports.updateProfile = (req, res) => {
  const user = users.find((item) => item.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim() : user.name;
  const company =
    typeof req.body.company === "string" ? req.body.company.trim() : user.company || "";
  const currentPropertyId =
    typeof req.body.currentPropertyId === "string"
      ? req.body.currentPropertyId.trim()
      : user.currentPropertyId || "";
  const preferences = normalizePreferences(req.body.preferences || user.preferences);

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  if (
    currentPropertyId &&
    !properties.some((property) => property.id === currentPropertyId)
  ) {
    return res.status(400).json({ message: "Please choose a valid property" });
  }

  user.name = name;
  user.company = company;
  user.currentPropertyId = currentPropertyId;
  user.preferences = preferences;

  res.json({
    message: "Profile updated successfully",
    user: serializeUser(user),
  });
};
