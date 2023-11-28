const express= require("express");
const app= express();
const userRoutes=require("./routes/User");
const profileRoutes=require("./routes/Profile");
const paymentRoutes=require("./routes/Payment");
const courseRoutes=require("./routes/Course");
const contactUsRoute = require("./routes/Contact");
const database = require("./config/database");
const cookieParser=require("cookie-parser");
const cors=require("cors");
const {cloudinaryConnect}=require("./config/cloudinary");
const fileUpload= require("express-fileupload");
const dotenv = require("dotenv");
const port = process.env.port||4000;
dotenv.config();
database.connect();
app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin:"*",
        credentials:true
    })
)
app.use(fileUpload({
    useTempFiles:true,
    tempFileDir:"/tmp"
}))

cloudinaryConnect();
 
app.use("/api/v1/auth",userRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/course",courseRoutes);
app.use("/api/v1/payment",paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);


app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"your server is up and running"
    })
})

app.listen(port,()=>{console.log(`app is running at port ${port}`)});