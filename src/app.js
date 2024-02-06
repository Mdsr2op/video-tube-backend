import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "100000kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import commentRouter from "./routes/comment.routes.js"
//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/comments", commentRouter)


export { app }