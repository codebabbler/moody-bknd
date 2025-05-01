import dotenv from "dotenv";
import connectDB from "./db";

dotenv.config({
  path: "./.env",
});
connectDB();

/*
import express from "express";
const app = express();
async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
    console.log("Connected to MongoDB");
    app.on("error", (error) => {
      console.log(error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("ERROR: ", error);
  }
};
*/
