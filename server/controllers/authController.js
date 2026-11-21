
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Register User
export const register = async (req, res) => {
  try {
    const { name, email, password, role, teacherCode } = req.body;

    // Check Required Fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Validate Password
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password kam se kam 6 characters ka hona chahiye",
      });
    }

    // Validate Email
    const normalizedEmail = email.trim().toLowerCase();

    // Default Role
    let finalRole = "student";

    // Teacher Verification
    if (role === "teacher") {
      if (!process.env.TEACHER_CODE) {
        return res.status(500).json({
          message: "Teacher code server par configure nahi hai",
        });
      }

      if (
        !teacherCode ||
        teacherCode.trim() !== process.env.TEACHER_CODE.trim()
      ) {
        return res.status(403).json({
          message: "Invalid teacher code",
        });
      }

      finalRole = "teacher";
    }

    // Check Existing User
    const exists = await User.findOne({
      email: normalizedEmail,
    });

    if (exists) {
      return res.status(400).json({
        message: "This email is already registered",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: finalRole,
    });

    // Send Response
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });

  } catch (err) {
    console.error("Registration Error:", err);

    res.status(500).json({
      message: "Registration failed",
    });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter both email and password",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find User
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        field: "email",
        message: "No account found with this email",
      });
    }

    // Compare Password
    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(401).json({
        field: "password",
        message: "Incorrect password",
      });
    }

    // Send Login Response
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });

  } catch (err) {
    console.error("Login Error:", err);

    res.status(500).json({
      message: "Login failed",
    });
  }
};

// Get Logged-in User
export const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    res.status(500).json({
      message: "User details fetch nahi ho paye",
    });
  }
};