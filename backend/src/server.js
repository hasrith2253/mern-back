import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.routes.js";
import { postRouter } from "./routes/post.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || "http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.set("trust proxy", 1);

app.get("/", (req, res) => {
  res.send("Backend API is running successfully");
});

app.get("/api/health", (req, res) => {
  res.json({ message: "MERN Blog API is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);

app.use(notFound);
app.use(errorHandler);

await connectDB();

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
