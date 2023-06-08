const jwt = require("jsonwebtoken");
const { UserModel } = require("../Models/user.model");
require("dotenv").config();

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;
  try {
    const decode = jwt.verify(token, process.env.NORMAL_TOKEN);
    const { userId } = decode;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(403).send({ message: "User Not found" });
    }
    res.user = user;
    next();
  } catch (error) {
    return res.status(500).send({ Error: error.message });
  }
};

module.exports = { authenticate };
