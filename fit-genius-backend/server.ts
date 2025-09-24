import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app: Application = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});



export default app;
