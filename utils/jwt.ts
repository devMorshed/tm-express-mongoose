import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";
import ApiResponse from "./ApiResponse";

// access token expiry
const accessTokenExpiry = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES || "300",
  10
);

// refresh token expiry
const refreshTokenExpiry = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES || "300",
  10
);

// token interface
interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure: boolean;
}

export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpiry * 60 * 60 * 1000),
  maxAge: accessTokenExpiry * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: false,
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpiry * 60 * 60 * 1000),
  maxAge: refreshTokenExpiry * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: false,
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccesToken();
  const refreshToken = user.SignRefreshToken();

  redis.set(user._id, JSON.stringify(user) as any);

  // parse env variables to intregate with fallback values
  if (process.env.NODE_ENV === "produnction") {
    accessTokenOptions.secure = true; //initialy false
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.json(new ApiResponse(200, "Token Saved", true, { user, accessToken }));
};
