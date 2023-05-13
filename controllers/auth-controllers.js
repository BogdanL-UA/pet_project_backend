const bctypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { HttpError } = require("../helpers");

const { User } = require("../models/user");
const { ctrlWrapper } = require("../utils");
const { SECRET_KEY } = process.env;

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bctypt.hash(password, 10);
  console.log("hashPassword: ", hashPassword);

  const result = await User.create({ ...req.body, password: hashPassword });
  const { name, birthday, phone, city } = result;
  res.status(201).json({
    email: result.email,
    name,
    birthday,
    phone,
    city,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Invalid email or password");
  }

  const passwordCompare = await bctypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Invalid email or password");
  }
  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });
  res.json({
    token,
  });
};

const getCurrent = async (req, res) => {
  const { email, name, birthday, phone, city } = req.user;
  res.json({
    email: email,
    name: name,
    birthday: birthday,
    phone: phone,
    city: city,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.json({
    message: "Logout success",
    status: 204,
  });
};

const updateUserInfo = async (req, res) => {
  const { body } = req;
  const { _id, email } = req.body;

  const result = await User.findOneAndUpdate(_id, { ...body });

  if (!result) {
    throw HttpError(404);
  }

  const user = await User.findOne({ email });
  console.log("user: ", user);
  const { birthday, phone, city, name } = user;
  res.json({ birthday, phone, city, name, email });
};

const getUserInfo = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  const { birthday, phone, city, name } = user;
  res.json({ birthday, phone, city, name, email });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSubscription: ctrlWrapper(updateUserInfo),
  getUserInfo: ctrlWrapper(getUserInfo),
};
