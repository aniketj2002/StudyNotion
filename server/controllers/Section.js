const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
  try {
    //data fetch
    const { sectionName, courseId } = req.body;

    //data validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "section name or course id is missing",
      });
    }
    //create section
    const newSection = await Section.create({ sectionName });

    // update course with section objectID
    const updateCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id
        }
      },
      { new: true }
      )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();
      
      console.log("helloooooo")
      console.log(updateCourseDetails)
      //return response
      return res.status(200).json({
        success: true,
        message: "Section created successfully",
        updateCourseDetails,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error occured while creating section",
      error: error.message,
    });
  }
};

//update a section

exports.updateSection = async (req, res) => {
  try {
    //data input
    const { sectionName, sectionId } = req.body;

    //data validation
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "section name or course id is missing",
      });
    }

    //update data
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );

    //return response
    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error occured while updating section",
      error: error.message,
    });
  }
};

//delete a section

exports.deleteSection = async (req, res) => {
  try {
    //get id- assuming we are sending id in params
    const { sectionId } = req.body;

    //use findByIdAndDelete
    await Section.findByIdAndDelete(sectionId);

    //return response
    return res.status(200).json({ 
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error occured while deleting section",
      error: error.message,
    });
  }
};
