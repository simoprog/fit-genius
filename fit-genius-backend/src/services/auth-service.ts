import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UpsertUser } from "../types/users";
import { users } from "../schema/users";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index";
import { refreshTokens } from "../schema/refresh-tokens";

// JWT config
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "15m";

// Password validation rules
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Utility functions
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (user: { id: string; email: string }): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

// Validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string) => {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    );
  }

  if (!PASSWORD_REGEX.test(password)) {
    errors.push(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Authentication functions
export const registerUser = async (userData: UpsertUser) => {
  const { email, password, firstName, lastName } = userData;

  try {
    // Validate input
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Trim and lowercase email
    const cleanEmail = email.toLowerCase().trim();

    if (!validateEmail(cleanEmail)) {
      throw new Error("Invalid email format");
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(". "));
    }

    // Check if user already exists - FIXED QUERY
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new Error("User already exists with this email");
    }

    const hashedPassword = await hashPassword(password);

    // Insert new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: cleanEmail,
        passwordHash: hashedPassword,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
      })
      .returning();

    if (!newUser) {
      throw new Error("Failed to create user");
    }

    const accessToken = generateToken(newUser);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(refreshTokens).values({
      userId: newUser.id,
      token: refreshToken,
      expiresAt: expiresAt,
    });

    // Return user without password hash
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      createdAt: newUser.createdAt,
    };

    return {
      success: true,
      user: userResponse,
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    console.error("Registration failed:", error);
    return {
      success: false,
      error: error.message || "Registration failed",
    };
  }
};

// User login
export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  const { email, password } = credentials;

  try {
    // Validate input
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query user - FIXED QUERY
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (foundUsers.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = foundUsers[0];

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return { success: true, accessToken, refreshToken };
  } catch (error: any) {
    console.error("Login failed:", error);
    return {
      success: false,
      error: error.message || "Login failed",
    };
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshTokenValue: string) => {
  try {
    if (!refreshTokenValue) {
      throw new Error("Refresh token is required");
    }

    const storedTokens = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshTokenValue),
          eq(refreshTokens.isRevoked, false)
        )
      )
      .limit(1);

    if (storedTokens.length === 0) {
      throw new Error("Invalid refresh token");
    }

    const storedToken = storedTokens[0];

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Revoke expired token
      await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.id, storedToken.id));

      throw new Error("Refresh token expired");
    }

    // Get user
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, storedToken.userId))
      .limit(1);

    if (foundUsers.length === 0) {
      throw new Error("User not found");
    }

    // Generate new access token
    const accessToken = generateToken(foundUsers[0]);

    return {
      success: true,
      accessToken,
      message: "Token refreshed successfully",
    };
  } catch (error: any) {
    console.error("Refresh token failed:", error);
    return {
      success: false,
      error: error.message || "Refresh token failed",
    };
  }
};

// Logout (revoke refresh token)
export const logoutUser = async (refreshTokenValue: string | undefined) => {
  try {
    if (!refreshTokenValue) {
      return {
        success: true,
        message: "Logged out successfully",
      };
    }

    // Revoke refresh token
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.token, refreshTokenValue));

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "Logout failed",
    };
  }
};

// Verify JWT token (for middleware)
export const verifyToken = (token: string) => {
  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      decoded,
    };
  } catch (error: any) {
    console.error("Token verification failed:", error);
    return {
      success: false,
      error: error.message || "Token verification failed",
    };
  }
};

// Clean up expired refresh tokens (run periodically)
export const cleanupExpiredTokens = async () => {
  try {
    const now = new Date();
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(and(eq(refreshTokens.isRevoked, false)));

    console.log(`Cleaned up expired refresh tokens`);
  } catch (error) {
    console.error("Token cleanup error:", error);
  }
};
