const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto=require("crypto");
//resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
  try {
    //get email from req body
    const email = req.body.email;

    //check user for this email
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({
        succes: false,
        message: "Your email is not registered",
      });
    }

    //generate token
    const token = crypto.randomUUID();
    //update user by adding token and expiration time
    const updatedetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );

    // create url
    const url = `http://localhost:3000/update-password/${token}`;

    // send mail
    await mailSender(
      email,
      "password reset link",
      `password reset link: ${url}`
    );

    //return respose
    return res.json({
      success: true,
      message:
        "Email sent successfully, please check email and change password",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "something went wrong please try again later",
    });
  }
};

//resetPassword
exports.resetPassword = async (req, res) => {
  try {
    //data fetch
    const { password, confirmPassword, token } = req.body;

    //validation
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "password and confirm passowrd doesn't match",
      });
    }
    // get userdetails from db using token
    const userDetails = await User.findOne({ token: token });
    if (!userDetails) {
      return res.json({
        success: false,
        message: "not a valid token to reset password",
      });
    }

    // check time of token expire
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: "token expired, please regenerate the link to reset password",
      });
    }

    // hashing the new password
    const hashPass = await bcrypt.hash(password, 10);

    // password update in db
    await User.findOneAndUpdate(
      { token: token },
      {
        password: hashPass,
      },
      { new: true }
    );

    //return response
    return res.status(200).json({
      success: true,
      message: "password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Some error occured while changing the password",
    });
  }
};
  