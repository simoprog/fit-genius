import { verifyToken } from "../services/auth-service";

// Main authentication middleware (similar to Spring Security JWT filter)
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
        code: "TOKEN_MISSING",
      });
    }

    // Verify token
    const result = await verifyToken(token);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error,
        code: "TOKEN_INVALID",
      });
    }

    req.tokenData = result.decoded;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

// Optional authentication (won't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const result = await verifyToken(token);
      if (result.success) {
        req.tokenData = result.decoded;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};
