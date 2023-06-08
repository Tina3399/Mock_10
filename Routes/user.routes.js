const express = require("express");
const { UserModel } = require("../Models/user.model");
const { authenticate } = require("../Middleware/Authentication");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../Services/nodemailer");

require("dotenv").config();

const userRouter = express.Router();

// register route

userRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed_password = bcrypt.hashSync(password, 5);
    const user = new UserModel({
      name,
      email,
      password: hashed_password,
    });
    await user.save();

    res.status(201).send({ msg: "User registered successfully." });
  } catch (error) {
    res
      .status(500)
      .send({ msg: "Something went wrong.", error: error.message });
  }
});

// login route
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Finding user by username

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.send({ msg: "Invalid username or password" });
    }

    // comparing password

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.send({ msg: "Invalid username or password." });
    }

    // send otp
    const otp = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    console.log(otp);

    sendEmail({
      email: email,
      subject: "Login OTP",
      body: `Your OTP is ${otp}`,
    });

    // creating token

    const token = jwt.sign({ userId: user._id }, process.env.NORMAL_TOKEN);

    res.status(201).send({ msg: "Login Successful", token: token, otp: otp });
  } catch (error) {
    res
      .status(500)
      .send({ msg: "Something went wrong.", error: error.message });
  }
});

userRouter.get("/allUser", async (req, res) => {
  const { userId } = req.query;
  try {
    const users = await UserModel.find({
      _id: { $ne: userId },
    });
    res.send(users);
  } catch (error) {
    res.send(error.message);
  }
});
// sender / receiver id;
userRouter.get("/alreadyConnectedUser", async (req, res) => {
  const { userId } = req.query;
  try {
    const users = await UserModel.findOne({
      _id: userId,
    });
    let arr = users.chatMessageModel;
    let obj = {};
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].senderId == userId) {
        obj[arr[i].receiverId] = 1;
      } else {
        obj[arr[i].senderId] = 1;
      }
    }
    console.log(obj);
    let ans = [];
    for (key in obj) {
      const eleUser = await UserModel.findOne({
        _id: key,
      });
      ans.push(eleUser);
    }
    res.send([ans, users.name]);
  } catch (error) {
    res.send(error.message);
  }
});
// get all msg  , clear chat (userId1 , userId2) clear
// get all messages
userRouter.get("/getAllMessages", async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    const userChatData = await UserModel.findOne({ _id: user1 });
    const msgs = userChatData.chatMessageModel;
    let allData = [];
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].senderId === user1 && msgs[i].receiverId === user2) {
        allData.push({ data: msgs[i], type: "send" });
      } else if (msgs[i].senderId === user2 && msgs[i].receiverId === user1) {
        allData.push({ data: msgs[i], type: "receive" });
      }
    }
    res.send(allData);
  } catch (error) {
    res.send({ message: "Something went wrong", error: error.message });
  }
});

module.exports = { userRouter };
