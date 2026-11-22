import express from "express";
import http from "http";
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes"
import callHistoryRoutes from "./routes/callHistory.routes"
import statusRoutes from "./routes/status.routes"
import mediaRoutes from "./routes/media.routes"
import { initializeSocket } from "./socket/socket";
import { initializeFirebase } from "./config/firebase";

dotenv.config();

// Initialize Firebase Admin
initializeFirebase();

const app = express()

app.use(express.json({ limit: "50mb" })); // Increase limit for base64 images
app.use(cors());

app.use("/auth",authRoutes)
app.use("/api/call-history", callHistoryRoutes)
app.use("/api/status", statusRoutes)
app.use("/api/media", mediaRoutes)

app.get("/",(req,res)=>{
    res.send("Server is running")
})

const PORT = process.env.PORT || 3000;
const server  =  http.createServer(app);

//listen to socket (Note: This will not work correctly in Vercel serverless environment)
initializeSocket(server)

connectDB().then(()=>{
    console.log("Database Connected");
    
    server.listen(PORT,()=>{
       console.log("✅ Server is listening on PORT =", PORT);   
    });
}).catch((error)=>{
    console.log("failed to start due to database connection error : ", error);
});

// 404 Handler for undefined routes
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).json({ success: false, msg: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler to ensure JSON responses (catches body-parser SyntaxErrors, etc)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err.message);
    res.status(err.status || 500).json({ 
        success: false, 
        msg: err.message || "Internal Server Error" 
    });
});

export default app;