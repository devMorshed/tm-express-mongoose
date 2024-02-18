import app from "./app";
import dotenv from "dotenv";

import { connectDB } from "./utils/db";

// modified dotenv config (requiring to importing )
dotenv.config({
  path: "./.env",
});

// Server creation after connecting database
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
