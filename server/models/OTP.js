const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 5 * 60,
  },
});
// to send mails
async function sendVerificationMail(email, otp) {
  try {
    const mailResponse = await mailSender(email, "verification Email",emailTemplate(otp));
    console.log("Email sent successfully");
  } catch (error) {
    console.log("error occured while sending mails:", error);
    throw error;
  }
}



otpSchema.pre("save", async function (next) {
    console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationMail(this.email, this.otp);
	}
	next();
});
const OTP = mongoose.model("OTP", otpSchema);

module.exports=OTP;