import express from "express";
import http from "http";
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes"
import { initializeSocket } from "./socket/socket";
import { initializeFirebase } from "./config/firebase";

dotenv.config();

// Initialize Firebase Admin
initializeFirebase();

const app = express()

app.use(express.json());
app.use(cors());

app.use("/auth",authRoutes)

app.get("/",(req,res)=>{
    res.send("Server is running")
})

const PORT = process.env.PORT || 3000;
const server  =  http.createServer(app);

//listen to socket (Note: This will not work correctly in Vercel serverless environment)
initializeSocket(server)

connectDB().then(()=>{
    console.log("Database Connected");
    
    // In Vercel, the app is exported and Vercel handles the listening.
    // We only explicitly listen if we are running locally (not in Vercel).
    if (process.env.NODE_ENV !== 'production') {
        server.listen(PORT,()=>{
           console.log("✅ Environment loaded, PORT =", process.env.PORT);   
        })
    }
}).catch((error)=>{
    console.log("failed to start due to database connection error : ", error);
})

export default app;