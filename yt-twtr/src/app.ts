import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes";
import healthCheckRouter from "./routes/healthCheck.routes";
import videoRouter from "./routes/video.routes";
import tweetRouter from "./routes/tweet.routes";
import likeRouter from "./routes/like.routes";
import commentRouter from "./routes/comment.routes";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthCheck", healthCheckRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);

export { app };
