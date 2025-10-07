import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // default role to 'customer' if not provided
  let role = "customer";

  if (req.user && req.user.role === "admin" && req.body.role) {
    // allow admin to set role when creating users from admin area
    role = req.body.role;
  }

  if (!name || !email || !password) {
    return res.status(400).json({
      msg: "All fields are required",
    });
  }
  try {
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "customer"]
    );

    const token = jwt.sign(
      { id: result.insertId, username: name, email, role: role || "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in prod
      sameSite: "lax",
      maxAge: 3600 * 1000,
    });

    res.status(201).json({
      msg: "User registered successfully",
      token,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
});

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Please provide email and password" });
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: users[0].id,
        username: users[0].username,
        email,
        role: users[0].role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in prod
      sameSite: "lax",
      maxAge: 3600 * 1000,
    });

    res.status(200).json({
      msg: "Login successful",
      role: users[0].role,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in prod
      sameSite: "lax",
      maxAge: new Date(0),
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }

  res.status(200).json({ msg: "Logout successful" });
});

export default router;
