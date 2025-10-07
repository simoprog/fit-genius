import express from "express";
import {
  loginUser,
  refreshAccessToken,
  registerUser,
  logoutUser,
} from "../services/auth-service";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, confirmPassword } = req.body;
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
        details: {
          email: !email ? "Email is required" : null,
          password: !password ? "Password is required" : null,
        },
      });
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match",
      });
    }
    const result = await registerUser({ email, password, firstName, lastName });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
    // Set refresh token as httpOnly cookie for security
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: result.user,
      });
    }
  } catch (error) {
    console.error("Registration endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed. Please try again.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Attempt login
    const result = await loginUser({ email, password });

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }
    // Set refresh token as httpOnly cookie for security
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return success with access token
    res.json({
      success: true,
      message: "Login successful",
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error("Login endpoint error:", error);
    return res.status(500).json({
      success: false,
      error: "Login failed. Please try again.",
    });
  }
});

// Refresh Access Token
router.post("/refresh", async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token not provided",
      });
    }

    // Refresh the access token
    const result = await refreshAccessToken(refreshToken);

    if (!result.success) {
      // Clear invalid refresh token cookie
      res.clearCookie("refreshToken");
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }

    // Return new access token
    res.json({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error("Token refresh endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Token refresh failed. Please try again.",
    });
  }
});

// User Logout
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // Revoke refresh token
    await logoutUser(refreshToken);

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed. Please try again.",
    });
  }
});
