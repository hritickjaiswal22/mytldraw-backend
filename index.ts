import { ACTIONS } from "./actions";
import { UserSocketMapType } from "./types";

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

function getAllConnectedClients(roomId: string) {
  // io.sockets.adapter.rooms.get(roomId) -> returns a set of all unique sockets or clients associated with that room

  // Map
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

const userSocketMap: UserSocketMapType = {};

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log("Server connected on socket id", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId); // Joins a room with roomId or if room does'nt exist creates one with that id
    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.NEWUSERJOINED, {
        clients,
        username, // The use which joined newly or latest user
        socketId: socket.id,
      });
    });
  });

  socket.on("disconnecting", () => {
    // This event is fired automatically when a client disconnects

    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
  });

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
