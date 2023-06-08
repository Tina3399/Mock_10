const express = require("express");

const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const { connection } = require("./config/db");
const { userRouter } = require("./Routes/user.routes");

const app = express();

app.use(cors());

require("dotenv").config();

app.use(express.json());

app.use("/api", userRouter);

// server connection

const server = http.createServer(app);
const io = socketio(server);

const obj = {};
io.on("connection", (socket) => {
  console.log("User Joined");
  socket.on("createConnection", (userId) => {
    obj[userId] = socket.id;
  });
  //server listening
  socket.on("chatMsg", async (msg, receiverId, senderId) => {
    let newMsg = {
      message: msg,
      senderId: senderId,
      receiverId: receiverId,
    };
    await UserModel.updateOne(
      { _id: senderId },
      { $push: { chatMsg: newMsg } }
    );
    await UserModel.updateOne(
      { _id: receiverId },
      { $push: { chatMsg: newMsg } }
    );
    // to individual socketid (private message)
    io.to(obj[receiverId]).emit("receivedMsg", msg, senderId);
  });
  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

server.listen(process.env.PORT, async () => {
  try {
    await connection;
    console.log("Connected to DB.");
  } catch (error) {
    console.log("Error connecting to DB");
  }

  console.log(`Server runnung on PORT ${process.env.PORT}`);
});
