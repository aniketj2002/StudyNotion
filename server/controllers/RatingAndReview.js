const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

//create Rating
exports.createRating = async (req, res) => {
  try {
    //get user id
    const { userId } = req.user.id;

    //fetch data from req
    const { rating, review, courseId } = req.body;

    //check if user is enrolled
    const courseDetails = await Course.findone({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $ep: userId } },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in course",
      });
    }

    //check if user already reviewed the corusee
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "course already reviewed",
      });
    }

    //create rating and review
    const ratingReview = await RatingAndReview.create({
      reting,
      review,
      course: courseId,
      user: userId,
    });

    // update course with this rating and review
    await Course.findByIdAndUpdate(courseId, {
      $push: { ratingAndReview: ratingReview._id },
    });

    // return response
    return res.status(200).json({
      success: true,
      message: "Rating and review created successfully",
      ratingReview,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message + " error occured while creating review",
    });
  }
};

//getAverageRating
exports.getAverageRating = async (req, res) => {
  try {
    //get course rating
    const { courseId } = req.body;

    //calculate average rating
    const averageRating = await RatingAndReview.aggregate({
      $match: {
        course: new mongoose.Types.ObjectId(courseId),
      },
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
      },
    });

    //return rating
    if (averageRating.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: averageRating[0].averageRating,
      });
    }
    return res.status(200).json({
      success: true,
      message: "average rating is zero for this course as no one reviewed it ",
      averageRating: 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message + " error occued while getting average rating",
    });
  }
};

//get all rating
exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desi" })
      .populate({ path: "user", select: "firstName lastName image email" })
      .populate({ path: "course", select: "courseName" })
      .exec();
    return res.status(200).json({
      success: true,
      message: "All reviews fetched successfully",
      data: allReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " error occured whle fetching all ratings",
    });
  }
};
