const mongoose= require("mongoose");
require("dotenv").config();
exports.connect=()=>{
    mongoose.connect(process.env.MONGODB_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
    .then(()=>{console.log("DB connected Successfully")})
    .catch((error)=>{
        console.error(error),
        console.log("Error Connecting to DB"),
        process.exit(1)
    })
};


 