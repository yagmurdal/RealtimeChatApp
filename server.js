const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUser,
} = require("./utils/users");
// import { ServerChatMessageEvent, ClientChatMessageEvent } from "./names.js";

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const ServerChatMessageEvent = "chatMessage";
const ClientChatMessageEvent = "message";

// setting static folder
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const botName = "WineNot? Bot";

// run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // only message the client that joins
    // welcomes current user
    socket.emit(
      ClientChatMessageEvent,
      formatMessage(botName, "Drinkin Wine Feelin Fine, Welcome!")
    );

    // broadcast when a user connects
    // message the everyone expect client that joins
    socket.broadcast
      .to(user.room)
      .emit(
        ClientChatMessageEvent,
        formatMessage(botName, `${user.username} has joined the chat! :)`)
      );

    // send users and room info

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUser(user.room),
    });
  });

  // broadcast to everyone
  // io.emit()

  // listen for chatMessage
  socket.on(ServerChatMessageEvent, (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit(
      ClientChatMessageEvent,
      formatMessage(user.username, msg)
    );
  });

  // runs when client disconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        ClientChatMessageEvent,
        formatMessage(botName, `${user.username} has left the chat! :/`)
      );

      // send users and room info

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUser(user.room),
      });
    }
  });
});
