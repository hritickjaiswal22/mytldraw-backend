import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log("Server connected");

  socket.on("moving", (vals) => {
    socket.broadcast.emit("moving", vals);
  });

  socket.on("scaling", (vals) => {
    socket.broadcast.emit("scaling", vals);
  });

  socket.on("rotating", (vals) => {
    socket.broadcast.emit("rotating", vals);
  });

  socket.on("removed", (vals) => {
    socket.broadcast.emit("removed", vals);
  });

  socket.on("objet:added", (json) => {
    socket.broadcast.emit("objet:added", json);
  });
});

httpServer.listen(3000);
