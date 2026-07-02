import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import groupRoutes from "./routes/group.route.js";
import receiptRoutes from "./routes/receipt.route.js";
import userRoutes from "./routes/user.route.js";
import invitationRoutes from "./routes/initvitation.route.js";
import notificationRoutes from "./routes/notification.route.js";
import settlementRoutes from "./routes/settlement.route.js";

import { initMonthlySummaryTask } from "./tasks/monthlySummary.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://split-wise-clone-1-c70a.onrender.com", 
  "http://localhost:5173" 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invitation", invitationRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/settlement", settlementRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "Up",
    message: "The node server is up and listening",
  });
});

initMonthlySummaryTask();

io.on("connection", (socket) => {
  console.log(`⚡ New Real-Time Connection: ${socket.id}`);

  socket.on("join_user", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("join_group", (groupId) => {
    socket.join(groupId);
    console.log(`Joined group ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);
});