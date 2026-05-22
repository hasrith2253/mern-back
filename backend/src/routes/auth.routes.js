import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const publicUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;
    const allowedRoles = ["USER", "AUTHOR"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Register as USER or AUTHOR only" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);

    res.status(201).json({ message: "Account created", payload: publicUser(user) });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({ message: "Login success", payload: publicUser(user) });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ message: "Authenticated", payload: publicUser(req.user) });
  }),
);

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Logout success" });
});
