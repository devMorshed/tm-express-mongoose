import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes";
import ErrorMiddleware from "./middleware/error";
import ApiResponse from "./utils/ApiResponse";
import ApiError from "./utils/ApiError";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "1024kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// using all user router
app.use("/api/v1", userRouter);

// pinging route
app.get("/ping", (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json(
      new ApiResponse(200, "Beep! Beep! Beep! | Your server is alive!!")
    );
  } catch (error: any) {
    return next(new ApiError(error.message, 400));
  }
});

// unknown/catch all route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 400;
  next(err);
});

app.use(ErrorMiddleware);

export default app;
