import { ACTIONS } from "./actions";
import { UserSocketMapType } from "./types";

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

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
app.use(cors({ origin: process.env.FRONTEND_DOMAIN }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_DOMAIN,
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

  socket.on(ACTIONS["OBJECT:MOVING"], ({ roomId, json }) => {
    socket.to(roomId).emit(ACTIONS["OBJECT:MOVING"], json);
  });

  socket.on(ACTIONS["OBJECT:SCALING"], ({ roomId, json }) => {
    socket.to(roomId).emit(ACTIONS["OBJECT:SCALING"], json);
  });

  socket.on(ACTIONS["OBJECT:ROTATING"], ({ roomId, json }) => {
    socket.to(roomId).emit(ACTIONS["OBJECT:ROTATING"], json);
  });

  socket.on(ACTIONS["OBJECT:REMOVED"], ({ roomId, json }) => {
    socket.to(roomId).emit(ACTIONS["OBJECT:REMOVED"], json);
  });

  socket.on(ACTIONS["OBJECT:CHANGED"], ({ roomId, ...rest }) => {
    socket.to(roomId).emit(ACTIONS["OBJECT:CHANGED"], rest);
  });

  socket.on(ACTIONS["OBJECT:ADDED"], ({ roomId, json }) => {
    socket.to(roomId).emit(ACTIONS["OBJECT:ADDED"], json);
  });

  socket.on(ACTIONS["TEXT:CHANGED"], ({ roomId, json }) => {
    socket.to(roomId).emit(ACTIONS["TEXT:CHANGED"], json);
  });
});

httpServer.listen(3000);
