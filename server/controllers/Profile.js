const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.updateProfile = async (req, res) => {
  try {
    //get data
    const {firstName="",lastName="", dateOfBirth = "", about = "", contactNumber="",gender="" } = req.body;

    //get userId
    const id = req.user.id;

    //find profile
    const userDetails = await User.findById(id);
    const profileDetails = await Profile.findById(userDetails.additionalDetails);

    const user = await User.findByIdAndUpdate(id, {
      firstName,
      lastName,
    })
    await user.save()

    //update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.contactNumber = contactNumber;
    profileDetails.gender=gender;
    await profileDetails.save();
    
    const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec()
    //return response
    return res.status(200).json({
      success: true,
      message: "profile updated successfully",
      updatedUserDetails,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "something went wrong while updateing user profile",
    });
  }
};

//delete account
exports.deleteAccount = async (req, res) => {
  try {
    //get id
    console.log("tessttt")
    const id = req.user.id;

    //vaildation
    const userDetails = await User.findById(id);

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "something went wrong while updateing user profile",
      });
    }

    //delete profile

    await Profile.findByIdAndDelete({
      _id: userDetails.additionalDetails,
    });
    //pending:uneroll user from all enroled courses

    //delete user
    await User.findByIdAndDelete({ _id: id });
    //return response
    return res.status(200).json({
      success: true,
      message: "user deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "something went wrong while delete  user profile",
    });
  }
};

exports.getAllUserDetails = async (req, res) => {
  try {
    //fetching data
    const id = req.user.id;

    //validating data
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    //return response
    return res.status(200).json({
      success: true,
      message: "all user details fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error fetching all user details",
    });
  }
};

exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    const updateProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updateProfile,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id
    const userDetails = await User.findOne({
      _id: userId,
    })
      .populate("courses")
      .exec()
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};