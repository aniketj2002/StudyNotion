const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();

//send otp
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const checkUser = await User.findOne({ email });
    if (checkUser) {
      return res.status(401).json({
        success: false,
        message: "User already Exists",
      });
    }
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("Otp generated");
    var result = await OTP.findOne({ otp: otp });
    while (result) {
      var otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      const result = await OTP.findOne({ otp: otp });
    }
    //creating entry of otp in db
    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);

    console.log(otpBody);
    res.status(200).json({
      success: true,
      message: "otp sent successfully",
      otp,
    });
  } catch (error) {
    console.log("error sending otp", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//signup controller
exports.signUp = async (req, res) => {
  try {
    //fetching data from req
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      otp,
      accountType,
      contactNumber,
    } = req.body;

    //validating data
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "required fields are empty",
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password doesnot match",
      });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // find most  recent otp
    const recentOtp = await OTP.find({ email })
      .sort({ createdAT: -1 })
      .limit(1);
    console.log(recentOtp);

    //Validate otp
    if (recentOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: "otp not found",
      });
    } else if (recentOtp[0].otp !== otp) {
      console.log(otp);
      console.log(recentOtp);
      return res.status(400).json({
        success: false,
        message: "Invalid Otp",
      });
    }
    //hash user password
    const hashPass = await bcrypt.hash(password, 10);

    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);

    // create entry in db
    const profileDetails = await Profile.create({
      geneder: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashPass,
      accountType: accountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      contactNumber,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });
    return res.status(200).json({
      success: true,
      message: "User Created Succesfully",
      user,
    });
  } catch (error) {
    console.log("error sgining up", error);
    res.status(500).json({
      success: false,
      message: "Error Occurred! Please Try Again",
    });
  }
};

// login

exports.login = async (req, res) => {
  try {
    // fetching data
    const { email, password } = req.body;

    // validating data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    //user exists or not
    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered",
      });
    }

    // generaating JWT after validating password
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      // saving the token in user db
      user.token = token;
      user.password = undefined;

      //create cookie
      const options = {
        expiresIn: new Date(Date.now() + 3 * 60 * 60 * 1000 * 24),
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "logged in successfullyx",
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Ivalid password",
      });
    }
  } catch (error) {
    console.log("error loging in");
    return res.status(500).json({
      success: false,
      message: "login failure,",
    });
  }
};

//change password
exports.changePassword = async (req, res) => {
  try {
    // fetch data
    console.log("helloooooooo");
    const { oldPassword: password, newPassword, confirmPassword } = req.body;
    console.log(
      "update password test ::::::" +
        password +
        " " +
        newPassword +
        " " +
        confirmPassword
    );
    const user = await User.findById(req.user.id);

    //validating data
    if (newPassword != confirmPassword)
      return res.status(500).json({
        success: false,
        message: "new password and confirm password doesnt match",
      });
    if (!password || !newPassword || !confirmPassword)
      return res.status(400).json({
        success: false,
        message: "please fill all the fields",
      });

    //verifying old password
    if (await bcrypt.compare(password, user.password)) {
      const hashPass = await bcrypt.hash(newPassword, 10);

      //updating new passowrd in db
      const passUpdate = await User.findByIdAndUpdate(
        req.user.id,
        { passowrd: hashPass },
        { new: true }
      );

      if (!passUpdate) {
        return res.status(500).json({
          success: false,
          message: "error occured while updating the password",
        });
      }
      // Send notification email
      try {
        const emailResponse = await mailSender(
          passUpdate.email,
          "Password for your account has been updated",
          passwordUpdated(
            passUpdate.email,
            `Password updated successfully for ${passUpdate.firstName} ${passUpdate.lastName}`
          )
        );
        console.log("Email sent successfully:", emailResponse.response);
      } catch (error) {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error);
        return res.status(500).json({
          success: false,
          message: "Error occurred while sending email",
          error: error.message,
        });
      }

      //return response
      return res.status(200).json({
        success: true,
        message: "password updated successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Ivalid password",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error occured while updating the password" + error.message,
    });
  }
};
