import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { NewUser, UpsertUser, User } from "../types/users";
import { users } from "../schema/users";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { refreshTokens } from "../schema/refresh-tokens";

// JWT config
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION;

// Password validation rules
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Utility functions
const hashPassword = async (password: string) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};
const comparePassword = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword);
};
const generateToken = async (user: User) => {
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
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

// Validation functions
export const validateEmail = (email) => {
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

    if (!validateEmail(email)) {
      throw new Error("Invalid email format");
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(". "));
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        passwordHash: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      .returning();
    const accessToken = await generateToken(newUser);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({
      userId: newUser.id,
      token: refreshToken,
      expiresAt: expiresAt,
    });
    return { success: true, user: newUser, accessToken, refreshToken };
  } catch (error: any) {
    console.log("Registration failed", error);
    return {
      success: false,
      error: error.message || " Registration failed",
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

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLocaleLowerCase()),
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const accessToken = await generateToken(user);
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
    console.log("Login failed", error);
    return {
      success: false,
      error: error.message || " Login failed",
    };
  }
};
