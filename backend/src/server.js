import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.routes.js";
import { postRouter } from "./routes/post.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const allowedOrigins = (process.env.CLIENT_URL || "http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.set("trust proxy", 1);

app.get("/api/health", (req, res) => {
  res.json({ message: "MERN Blog API is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (req.accepts("html")) {
      return res.sendFile(path.join(frontendDistPath, "index.html"));
    }

    next();
  });
}

app.use(notFound);
app.use(errorHandler);

await connectDB();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
