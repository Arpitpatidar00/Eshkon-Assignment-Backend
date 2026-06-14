import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./db";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import publishRoutes from "./routes/publish";
import pageRoutes from "./routes/pages";
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cookieParser());

// Security Middlewares
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Too many requests from this IP, please try again later.",
  }),
);

// Standard Middlewares
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Database connection middleware (critical for Serverless environments)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/publish", publishRoutes);
app.use("/api/pages", pageRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

// Start Server conditionally (only when not running in Vercel Serverless environment)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Failed to connect to DB:", error);
    });
}

export default app;
