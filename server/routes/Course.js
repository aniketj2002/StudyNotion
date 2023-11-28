const express = require("express");
const router = express.Router();

//importing all the controllers
const {
  createCourse,
  getAllCourses,
  getCourseDetails,
} = require("../controllers/Course");
const {
  getAllCategories,
  createCategory,
  categoryPageDetails,
} = require("../controllers/Category");
// Sections Controllers Import
const {
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/Section");

// Sub-Sections Controllers Import
const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require("../controllers/Subsection");

// Rating Controllers Import
const {
  createRating,
  getAverageRating,
  getAllRating,
} = require("../controllers/RatingAndReview");

//importing middleware
const{auth, isInstructor, isStudent, isAdmin}=require("../middlewares/Auth");


// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************


router.post("/createCourse",auth,isInstructor,createCourse);
router.post("/addSection",auth,isInstructor,createSection);
router.post("/updateSection",auth, isInstructor, updateSection);
router.post("/deleteSection",auth, isInstructor, deleteSection);
router.post("/updateSubSection", auth, isInstructor, updateSubSection)
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection)
router.post("/addSubSection", auth, isInstructor, createSubSection)


//why not used middle ware to authenticate like others
//get all registered course
router.get("/getAllCourses", getAllCourses)
//get details of a speicific course
router.post("/getCourseDetails", getCourseDetails)




// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", getAllCategories)
router.post("/getCategoryPageDetails", categoryPageDetails)

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)

module.exports = router
