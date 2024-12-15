const db = require('../models');
const User = db.user;
const {Op} = require("sequelize");
const Yup = require('yup');
const JwtService = require("../services/jwtServices.js");

const checkToken = async (req, res) => {
  try {
    if (process.env.SERVER_JWT === "false") return next();
    const token = JwtService.jwtGetToken(req);
    const decoded = JwtService.jwtVerify(token);
    req.userId = decoded.userId;
    const user = await User.findByPk(decoded.userId);
    const {password, ...newUser} = user.get()

    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: newUser,
    });
  } catch (error) {
    res.status(403).json({
      statusCode: 403,
      message: "You need sign in",
    });
  }
}

const login = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      username: Yup.string().required(),
      password: Yup.string().required(),
      remember: Yup.boolean().required(),
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    let {username, password, remember} = req.body;
    const user = await User.findOne({
      where: {
        username: username,
      },
    });
    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        message: "Username does not exist",
      });
    }
    if (user.status === false) {
      return res.status(403).json({
        statusCode: 403,
        message: "Account has been locked",
      });
    }
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        statusCode: 401,
        message: "Username or password is incorrect",
      });
    }
    let accessToken = "";
    if (remember === false) {
      accessToken = JwtService.jwtSign({userId: user.id, role: user.role}, {expiresIn: "12h"});
    } else {
      accessToken = JwtService.jwtSign({userId: user.id, role: user.role}, {expiresIn: "7d"});
    }
    const {password: hashedPassword, ...userData} = user.get();
    const resBody = {
      accessToken,
      userData
    };
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: resBody,
    });
  } catch (e) {
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};

const register = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      username: Yup.string().required(),
      password: Yup.string().required().min(8, 'Password must be at least 8 characters long'),
      name: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    let {username, password, name} = req.body;
    const user = await User.findOne({
      where: {
        username: username,
      },
    });
    if (user) {
      return res.status(400).json({
        statusCode: 400,
        message: "Username already exists",
      });
    }
    const newUser = await User.create({
      username,
      password,
      name,
    });
    const {password: hashedPassword, ...userData} = newUser.get();
    return res.status(201).json({
      statusCode: 201,
      message: "OK",
      data: userData,
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}
const registerAdmin = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      username: Yup.string().required(),
      password: Yup.string().required(),
      name: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({
        statusCode: 400,
        message: "Anh em nhớ điền dữ liệu là String nha",
      });
    }
    let {username, password, name} = req.body;
    const user = await User.findOne({
      where: {
        username: username,
      },
    });
    if (user) {
      return res.status(400).json({
        statusCode: 400,
        message: "Username already exists",
      });
    }
    const newUser = await User.create({
      username,
      password,
      name,
      role: "admin"
    });
    return res.status(201).json({
      statusCode: 201,
      message: "OK",
      data: newUser,
    });
  } catch (e) {
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }

}

module.exports = {
  login,
  register,
  registerAdmin,
  checkToken
}
