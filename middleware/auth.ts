import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";

export const isAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { access_token } = req.cookies;

    if (!access_token) {
      return next(new ApiError("You have to login first!", 400));
    }

    // check the validity of the access token, retun error if invalid
    const decoded = jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN as string
    ) as JwtPayload; //as JwtPayload type is important

    if (!decoded) {
      return next(new ApiError("Invalid Access Token", 400));
    }

    // check the user after decoding access_token
    const user = await redis.get(decoded.id);

    if (!user) {
      return next(new ApiError("User not found", 400));
    }

    // storing user data to req  --- req.user type is declared on @types/custom.d.ts
    req.user = JSON.parse(user);

    next();
  }
);
