import app from "./app";
import { connectDB } from "./utils/db";
require("dotenv").config();

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
