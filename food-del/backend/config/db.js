import mongoose from "mongoose";

export const  connectDB = async () =>{

    await mongoose.connect('mongodb+srv://paraskumbhar:kps3101@cluster0.idw3tm5.mongodb.net/food-del').then(()=>console.log("DB Connected"));
   
}
