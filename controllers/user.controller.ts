require("dotenv").config();
import jwt, { Secret } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";

import ErrorHandler from "../utils/ErrorHandler";
import catchAsyncError from "../utils/catchAsyncError";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";


// email regex to validate email addresses
const emailRegexPattern: RegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{6,}@+[a-zA-Z0-9-]{3,}(?:\.[a-zA-Z0-9-]{3,})*$/;

// defining Register Body interface
interface IRegistrationBody {
  name: string;
  batch: number;
  room: number;
  block: string;
  email: string;
  password: string;
}

// User registration funtion
export const registrationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //  destructuring values
      const { name, batch, room, block, email, password } = req.body;

      //   checkpoint for empty fields
      if (!name || !email || !batch || !room || !password) {
        return next(
          new ErrorHandler("Please provide all neccessary information", 400)
        );
      }

      const validEmail = emailRegexPattern.test(email);
      if (!validEmail) {
        return next(
          new ErrorHandler("Please provide valid email address", 400)
        );
      }

      //   checking if user with this email alredy exists
      const existingEmail = await userModel.findOne({
        email,
      });
      if (existingEmail) {
        return next(new ErrorHandler("Email is already exists", 400));
      }

      const userData: IRegistrationBody = {
        name,
        batch,
        block,
        email,
        password,
        room,
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
            res.status(200).json({
              success: true,
              message: `Activation mail has been sent to ${userData.email}`,
              activationToken: token,
            });
          }
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
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

export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_code, activation_token } =
        req.body as IActivationRequest;

      const newUser: newUserInterface = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as newUserInterface;

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, batch, block, email, password, room, role } =
        newUser?.userData;

      const existingUser = await userModel.findOne({
        email,
      });

      if (existingUser) {
        return next(new ErrorHandler("User with this mail already exist", 400));
      }

      const user = await userModel.create({
        name,
        batch,
        block,
        email,
        password,
        room,
        role,
      });

      res.status(201).json({
        success: true,
        message: "User created.",
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
