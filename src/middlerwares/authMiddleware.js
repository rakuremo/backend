const db = require('../models');
const JwtService = require("../services/jwtServices.js");
const { BadTokenError } = require("../utils/apiError.js");
const User = db.user;

const authMiddleware = async (req, res, next) => {
    try {
        if (process.env.SERVER_JWT === "false") return next();
        const token = JwtService.jwtGetToken(req);
        const decoded = JwtService.jwtVerify(token);
        const user = await User.findByPk(decoded.userId);
        if(user.status === false || !user){
            return res.status(403).json({
                statusCode: 403,
                message: "Account has been locked",
            });
        }
        req.userId = decoded.userId;
        return next();
    } catch (error) {
        next(new BadTokenError())
    }
}
const isAmin = async (req, res, next) => {
    try {
        if (process.env.SERVER_JWT === "false") return next()
        const token = JwtService.jwtGetToken(req)
        const decoded = JwtService.jwtVerify(token);
        const user = await User.findByPk(decoded.userId);
        if (!decoded.role || !user) {
            return res.status(403).json(
              {
                  statusCode: 403,
                  message:  "You need sign in"
              }
            )
        }
        if (decoded.role !== "admin") {
            return res.status(403).json({
                statusCode: 403,
                message: "You are not an admin, you do not have permission for this action."})
        }
        req.userId = decoded.userId;
        return next()
    } catch (error) {
        next(new BadTokenError())
    }
}

module.exports = {
    authMiddleware,
    isAmin,
}
