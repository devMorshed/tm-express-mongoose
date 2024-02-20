require("dotenv").config();
import jwt, { Secret } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";

import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import ApiResponse from "../utils/ApiResponse";
import { sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";

// email regex to validate email addresses
const emailRegexPattern: RegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{6,}@+[a-zA-Z0-9-]{3,}(?:\.[a-zA-Z0-9-]{3,})*$/;

// defining Register Body interface
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
}

// User registration funtion
export const registrationUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //  destructuring values
      const { name, email, password } = req.body;

      //   checkpoint for empty fields
      if (!name || !email || !password) {
        return next(
          new ApiError("Please provide all neccessary information", 400)
        );
      }

      const validEmail = emailRegexPattern.test(email);
      if (!validEmail) {
        return next(new ApiError("Please provide valid email address", 400));
      }

      //   checking if user with this email alredy exists
      const existingEmail = await userModel.findOne({
        email,
      });
      if (existingEmail) {
        return next(new ApiError("Email is already exists", 400));
      }

      const userData: IRegistrationBody = {
        name,
        email,
        password,
      };

      //   activation token to verify user
      const activationToken = createActivationToken(userData);
      const { activationCode, token } = activationToken;

      const emailData = {
        user: { name: userData?.name },
        activationCode,
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        emailData
      );

      try {
        sendMail({
          email: userData.email,
          subject: "Account Activation",
          template: "activation-mail.ejs",
          data: emailData,
        }).then((data: any) => {
          console.log("status:", data);
          if (data.accepted.length > 0) {
            res.json(
              new ApiResponse(
                200,
                `Activation mail has been sent to ${userData.email}`,
                true,
                { activationToken: token }
              )
            );
          }
        });
      } catch (error: any) {
        return next(new ApiError(error.message, 400));
      }
    } catch (error: any) {
      return next(new ApiError(error.message, 400));
    }
  }
);

// interface for activation token
interface IActivationToken {
  token: string;
  activationCode: string;
}

// making activation code and token from JWT
export const createActivationToken = (
  userData: IRegistrationBody
): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      userData,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// Activate User
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

interface newUserInterface {
  userData: IUser;
  activationCode: string;
}

export const activateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_code, activation_token } =
        req.body as IActivationRequest;

      const newUser: newUserInterface = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as newUserInterface;

      if (newUser.activationCode !== activation_code) {
        return next(new ApiError("Invalid activation code", 400));
      }

      const { name, email, password, role } = newUser?.userData;

      const existingUser = await userModel.findOne({
        email,
      });

      if (existingUser) {
        return next(new ApiError("User with this mail already exist", 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
        role,
      });

      res.json(new ApiResponse(201, "User created"));
    } catch (error: any) {
      return next(new ApiError(error.message, 400));
    }
  }
);

interface IUserLogin {
  email: string;
  password: string;
}

export const loginUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return next(new ApiError("Please provide an email", 400));
      }
      if (!password) {
        return next(new ApiError("Please provide your password", 400));
      }

      // const existingUser = await userModel.findOne({ email });
      // if (!existingUser) {
      //   return next(new ApiError("No user found", 500));
      // }

      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        return next(new ApiError("Invalid email or password", 400));
      }

      const ispassMatched = await user?.comparePassword(password);

      if (ispassMatched) {
        sendToken(user, 200, res);
      } else {
        return next(new ApiError("Wrong Password", 400));
      }
    } catch (err: any) {
      return next(new ApiError("Something went wrong with login", 400));
    }
  }
);

export const logoutUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      // deleting user from redis
      const userId = req.user?._id || "";
      redis.del(userId);

      res.json(new ApiResponse(200, "User logged out successfully"));
    } catch (error: any) {
      return next(new ApiError(400, error.message || "error from Log out "));
    }
  }
);
