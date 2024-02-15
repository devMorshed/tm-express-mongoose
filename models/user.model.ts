require("dotenv").config();
import bcrypt from "bcryptjs";
import mongoose, { Document, Model, Schema } from "mongoose";

// email regex to validate email addresses
const emailRegexPattern: RegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{6,}@+[a-zA-Z0-9-]{3,}(?:\.[a-zA-Z0-9-]{3,})*$/;

// Creating IUser interface by extending Document
export interface IUser extends Document {
  name: string;
  avatar: string;
  role: string;
  email: string;
  password: string;
  comparePassword: (password: string) => Promise<boolean>;
}

// User Schema based on IUser interface.
const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your full name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email adress"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email address",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password can't be shorter than 6 characters. "],
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "USER",
    },
  },
  { timestamps: true }
);

// Hasshing Password
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Comparing password
UserSchema.methods.comparePassword = async function (
  enteredPass: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPass, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", UserSchema);

export default userModel;
