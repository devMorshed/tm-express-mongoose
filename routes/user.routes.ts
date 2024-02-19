import express from "express";
import {
  activateUser,
  registrationUser,
  userLogin,
} from "../controllers/user.controller";

const userRouter = express.Router();

userRouter.post("/registration", registrationUser);
userRouter.post("/activation", activateUser);
userRouter.post("/login", userLogin);

export default userRouter;
