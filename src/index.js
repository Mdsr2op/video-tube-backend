import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Fix: original code had path: './env' (treated as a folder, not a dotfile),
// so .env was never actually loaded. In Kubernetes we won't ship a .env file
// at all — env vars come from a Secret — but this still helps for local dev.
dotenv.config({
    path: "./.env",
});

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) =>
    res.json({
        message: "Hello from Express Server 👋🏻",
    })
);

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log("Server running on port " + PORT);
        });
    })
    .catch((err) => {
        console.log(`Failed to connect to mongodb !`, err);
        process.exit(1);
    });
