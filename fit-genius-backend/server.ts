import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
