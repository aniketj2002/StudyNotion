const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");
// capture the payemnt and initiate the Razorpay order


exports.capturePayment = async (req,res)=>{
  const {courses}=req.body;
  const userId=req.user.id;
  if(courses.length==0){
    return res.json({
      success:false,
      message:" Please provide course id"
    })
  }
  let totalAmount =0;
  for(const course_id of courses){
    let course;
    try {
      course= await Course.findById(course_id);
      if(!course){
        return res.status(400).json({success:false,
        message:" couldnot find the course"})
      }
       const uid= new mongoose.Types.ObjectId(userId);
       if(course.studentsEnrolled.includes(uid))
       {
        return res.status(200).json({
          success:false,message:"Student is already Enrolled"
        })
       }
       totalAmount+=course.prices;
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success:false,
        message:error.message
      })
    }
  }

  const options={
    amount: totalAmount*100,
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),

  }
  try {
    const paymentResponse=await instance.orders.create(options);
    res.json({
      success:true,
      message:paymentResponse
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success:false,
      message:error.message
    })
  }
};



// exports.capturePayment = async (req, res) => {
//   //get courseId and userId
//   const { course_id } = req.body;
//   const userId = req.user.id;

//   //validation
//   if (!course_id) {
//     return res.json({
//       success: false,
//       message: "please provide valid coursse id",
//     });
//   }

//   //valid courseDetails
//   let course;
//   try {
//     course = Course.findById(course_id);
//     if (!course) {
//       return res.json({
//         success: false,
//         message: "couldn't find the course",
//       });
//     }
//     //checking if user had already buy the course
//     const uid = new mongoose.Types.ObjectId(userId);
//     if (course.studentsEnrolled.include(uid)) {
//       return res.status(200).json({
//         success: false,
//         message: "student is already enrolled",
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message + " couldnt complete payment",
//     });
//   }

//   //order create
//   const amount = course.price;
//   const currency = "INR";
//   const options = {
//     amount: amount * 100,
//     currency,
//     receipt: Math.random(Date.now()).toString(),
//     notes: {
//       courseId: course_id,
//       userId,
//     },
//   };
//   try {
//     //intiate the payment
//     const paymentResponse = await instance.orders.create(options);
//     console.log(paymentResponse);

//     //return response
//     return res.status(200).json({
//       success: true,
//       courseName: course.courseName,
//       courseDescription: course.courseDescription,
//       thumbnail: course.thumbnail,
//       orderId: paymentResponse.id,
//       currency: paymentResponse.currency,
//       amount: paymentResponse.amount,
//       message: "Payment completed successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     return res.json({
//       success: false,
//       message: "could not intiate order",
//     });
//   }
// };

//verify signature of razorpay

// exports.verifySignature = async (req, res) => {
//   const webhookSecret = "12345678";
//   const signature = req.headers("x-razorpay-signature");

//   const shasum = crypto.createHmac("sha256", webhookSecret);
//   shasum.update(JSON.stringify(req.body));
//   const digest = shasum.digest("hex");

//   if (signature === digest) {
//     console.log("payment authorized");

//     const { courseId, userId } = req.body.payload.payment.entity.notes;

//     try {
//       //fullfil the action
//       //find the course and enroll the student in the course

//       const enrolledCourse = await Course.findByIdAndUpdate(
//         { _id: courseId },
//         {
//           $push: { studentsEnrolled: userId },
//         },
//         { new: true }
//       );

//       if (!enrolledCourse) {
//         return res.status(500).json({
//           success: false,
//           message: "course not found",
//         });
//       }
//       console.log(enrolledCourse);

//       //add the course into the user courses
//       const enrolledStudent = await User.findByIdAndUpdate(
//         { _id: userId },
//         {
//           $push: {
//             courses: courseId,
//           },
//         },
//         { new: true }
//       );
//       console.log(enrolledStudent);

//       //sending mail to confirm enrollement
//       const emailResponse = await mailSender(
//         enrolledStudent.email,
//         "congratulations",
//         "you are successfully enrolled in the course"
//       );

//       console.log(emailResponse);
//       return res.status(200).json({
//         success:true,
//         message:"signature verified and course added"
//       })
//     } catch (error) {
//         console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//     }
//   }
//   else{
//     return res.status(400).json({
//         success: false,
//         message: error.message+ "invlaid request"
//       });
//   }
// };



//verify payment

exports.verifyPayment=async(req,res)=>{
const razorpay_order_id = req.body?.razorpay_order_id;
const razorpar_payment_id=req.body?.razorpar_payment_id;
const razorpay_signature= req.body?.razorpay_signature;
const courses = req.body?.courses;
const userId= req.user.id;
 if(!courses||!razorpar_payment_id||!razorpay_order_id||!razorpay_signature||!userId){
  return res.status(200).json({success:false, message:"payment failed"})
 }
 let body = razorpay_order_id + "|"+ razorpar_payment_id;
 const expectedSignature= crypto.createHmac("sha256",process.env.RAZORPAY_SECRET).update(body.toString()).digest("hex");
 if(expectedSignature==razorpay_signature){
  await enrollStudents(courses,userId,res);
  return res.status(200).json({
    success:true,
    message:"payment verified"
  })
 }
 return res.status(200).json({
  success:false,
  message:"payment failed"
 })
};

const enrollStudents=async(courses, userId,res)=>{
  if(!courses||!userId){
return res.status(400).json({sucess:false, message:"user of course id missing"})
  }

  try {
    for(const courseId in courses){
      const enrolledCourse= await Course.findOneAndUpdate({_id:courseId},{$push:{
        studentsEnrolled:userId
      }},{new:true})
    
  
    if(!enrolledCourse){
      return res.status(500).json({
        success:false,
        message:"course not found "
      });
  
    }
    const enrolledStudent=await User.findByIdAndUpdate(userId,{
      $push:{
        courseId:courseId
      }
    },{new:true});
  
    const emailResponse= await mailSender(enrollStudents.email,`Successfully enrolled into ${enrolledCourse.courseName}`,courseEnrollmentEmail(enrolledCourse.courseName,`${enrollStudents.firstName}`));
    console.log("mail sent successfully",emailResponse.response);
    }
  } catch (error) {
    return res.status(500).json({success
    :false,message:"some error ocured during enrolling in courses"+error.message})
  }
}


exports.sendPaymentSuccessEmail= async(req,res)=>{
  const {orderId,paymentId, amount}=req.body;
  const userId= req.user.id;
  if(!orderId||!paymentId||!amount||!userId){
    return res.status(400).json({
      success:false,
      message:"please provide all the details"
    })
  }
  try {
    const enrolledStudent= await User.findById(userId);
    await mailSender(enrolledStudent.email,`payment recieved`,paymentSuccessEmail(`${enrolledStudent.firstName}`),amount/100,orderId,paymentId);
  } catch (error) {
    
  }
}