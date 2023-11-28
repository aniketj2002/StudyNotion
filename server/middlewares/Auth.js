const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
exports.auth = async (req, res, next) => {
  try {
    //extract token
    
    const token =
    req.cookies.token ||
    req.body.token ||
    req.header("Authorisation").replace("Bearer ", "");
    
    // checking if token is present or not
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "token missing",
      });
    }
    // verifying the token
    try {
      const decode =  jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.user = decode;
    } catch (error) {
      //verification issue
      return res.status(401).json({
        success: false,
        message: "error is invalid",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: " something went wrong while validating the tokken",
    });
  }
};

//isStudent
exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Student only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "user role cannot be verified, please try again",
    });
  }
};

//isAdmin
exports.isAdmin = async (req, res, next) => {
  try {
    
    if (req.user.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Admin only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "user role cannot be verified, please try again",
    });
  }
};

//isInstructor
exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Instructor only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "user role cannot be verified, please try again",
    });
  }
};
