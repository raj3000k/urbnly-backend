const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { JWT_SECRET } = require("../config/auth");
const {
  emptyPreferences,
  normalizePreferences,
} = require("../utils/matchmaking");

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  company: user.company || "",
  currentPropertyId: user.currentPropertyId || "",
  lookingForRoommate: Boolean(user.lookingForRoommate),
  preferences: normalizePreferences(user.preferences),
});

const issueToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

async function authenticateUser(email, password, requiredRole) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return { status: 400, message: "Email and password are required" };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { status: 400, message: "Invalid credentials" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { status: 400, message: "Invalid credentials" };
  }

  if (requiredRole && user.role !== requiredRole) {
    return {
      status: 403,
      message:
        requiredRole === "owner"
          ? "This login is only for property owners"
          : "This login is only for customers",
    };
  }

  return {
    user,
    token: issueToken(user.id),
  };
}

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

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role: "customer",
      company: normalizedCompany,
      lookingForRoommate: false,
      preferences: emptyPreferences(),
      password: hashedPassword,
    },
  });

  const token = issueToken(newUser.id);

  res.status(201).json({
    message: "User registered successfully",
    token,
    user: serializeUser(newUser),
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authenticateUser(email, password);

  if (!result.user) {
    return res.status(result.status).json({ message: result.message });
  }

  res.json({
    token: result.token,
    user: serializeUser(result.user),
  });
};

exports.customerLogin = async (req, res) => {
  const { email, password } = req.body;
  const result = await authenticateUser(email, password, "customer");

  if (!result.user) {
    return res.status(result.status).json({ message: result.message });
  }

  res.json({
    token: result.token,
    user: serializeUser(result.user),
  });
};

exports.ownerLogin = async (req, res) => {
  const { email, password } = req.body;
  const result = await authenticateUser(email, password, "owner");

  if (!result.user) {
    return res.status(result.status).json({ message: result.message });
  }

  res.json({
    token: result.token,
    user: serializeUser(result.user),
  });
};

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    user: serializeUser(user),
  });
};

exports.updateProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

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
  const lookingForRoommate =
    typeof req.body.lookingForRoommate === "boolean"
      ? req.body.lookingForRoommate
      : Boolean(user.lookingForRoommate);
  const preferences = normalizePreferences(req.body.preferences || user.preferences);

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  if (currentPropertyId) {
    const property = await prisma.property.findUnique({
      where: { id: currentPropertyId },
      select: { id: true },
    });

    if (!property) {
      return res.status(400).json({ message: "Please choose a valid property" });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      company,
      lookingForRoommate,
      preferences,
      currentProperty: currentPropertyId
        ? {
            connect: {
              id: currentPropertyId,
            },
          }
        : {
            disconnect: true,
          },
    },
  });

  res.json({
    message: "Profile updated successfully",
    user: serializeUser(updatedUser),
  });
};
