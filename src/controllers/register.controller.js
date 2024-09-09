import {asyncHandler} from "../utils/asyncHandler.js";

import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadfileonCloud from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



const generateAccessandRefreshTokens=async(userId)=>{
   try {
     const user=await User.findById(userId);
    const accessToken= await user.generateAccessToken;
    const refreshToken= await user.generateRefreshToken;
 
    user.refreshToken=refreshToken;
 
    await user.save({validateBeforeSave:false});
 
    return {accessToken, refreshToken};
   } catch (error) {
    console.error(error);
    throw new ApiError(500,"Server Error")
    
   }

// try {
//     const user=await User.findById({userId});
//     const accessToken=await user.generateAccessToken();
//     const refereshToken=await user.generateRefreshToken();
//     user.refereshToken=refereshToken
//     user.save({validateBeforeSave:false});

//     return {accessToken,refereshToken};

    
// } catch (error) {
//     throw new ApiError(500,"Server Error");
    
// }
   
   
    

}

const registerUser= asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"OK"

    // })
    const {fullname,email,username,password} = req.body;
    console.log(email, password);


    //validation
    if([fullname,email,username,password].some(fields=>fields?.trim() =="")){
        throw new ApiError(400,"All fields are required")

    }


    //if user already exists
    const existedUser = await User.findOne(
        {
            $or:[{email},{username}]
        }
    )

    if(existedUser){
        throw new ApiError(409,"Email or username already exists")
    }


    const avatarpath=req.files?.avatar[0]?.path;
    const coverImagepath=req.files?.coverImage[0]?.path;

    const avatar=await uploadfileonCloud(avatarpath);
    const coverImage=await uploadfileonCloud(coverImagepath);
    if(!avatar){
        throw new ApiError(400,"Failed to upload avatar");
    };
    const use=await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar:avatar?.url,
        coverImage:coverImage?.url || ""

    });

    const userx = await User.findById(use._id).select(
        "-password -refreshToken "
    );

    if(!userx){
        throw new ApiError(500,"Failed to register user");
    }


    res.status(201).json(
        new ApiResponse(200,userx,"User registered successfully")
    );



    
});


//login



//req-> body sa data laoo
//email -> email verify kro
//password -> password verify kro
//generate -> access and referesh token

const loginUser=asyncHandler(async(req,res)=>{
    const {email,password} = req.body;
    console.log(email);

    if(!email ){
        throw new ApiError(400,"Email is required");
    }

    const emailVerify=await User.findOne({
        $or:[{email}]
    });

    console.log(emailVerify)

    if(!emailVerify){
        throw new ApiError(400,"User has to register himself first");
    };

    
    const matchPassword= emailVerify.isPasswordCorrect(password);

    if(!matchPassword){
        throw new ApiError(401,"Invalid email or password");
    }


    const {refreshToken,accessToken}=await generateAccessandRefreshTokens(emailVerify._id);


    const loggedInUser = await User.findById(emailVerify._id);

    const options={
        httpOnly: true,
        secure:true,

    };

    res.status(203).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,
            {user:
                loggedInUser,accessToken,refreshToken},
            "User logged in successfully")
    );



//     // req.body sa data loo

//     const {email,password}=req.body;

//     //email verify

//    const usd=await User.findOne({email});

//    if(!usd){
//     throw new ApiError(400,"User has to register himself first");
//    }

//    const matchPass=usd.isPasswordCorrect(password);

//    if(!matchPass){
//     throw new ApiError(401,"Invalid email or password");
//    }

//    const {refreshToken,accessToken}=generateAccessandRefreshTokens(usd._id);

//    const loggedInUser=await User.findById(usd._id).select("-password -refereshToken");

//    const options={
//     httpOnly:true,
//     secure:true,
//    }

//    return res.status(200).cookie({"accessToken":accessToken}).cookie({"refereshToken":refreshToken}).
//    json(
//     new ApiResponse(
//     200,
//     {user:loggedInUser,accessToken,refreshToken},
//     "User logged in successfully")
  
//    )












})



const logout=asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options={
        httpOnly: true,
        secure:true,
    }


    res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200,{},"User logged out successfully")
    )

});

const RefereshAccessToken=asyncHandler(async(req,res)=>{
    const incomingToken=req.cookie.refreshToken || req.body?.refreshToken;

    if(!incomingToken){
        throw new ApiError(402, "error occured during incoming token")
    }

    const userverify =  jwt.verify(incomingToken,process.env.REFRESH_TOKEN_SECRET)

    

    const user= await User.findById(userverify?._id);

    if(!user){
        throw new ApiError(402,"unable to fetch user");

    }
    if(incomingToken !== user.refreshToken){
        throw new ApiError(402,"Invalid credentials")
    }

    const {accessToken,newrefreshToken}=generateAccessandRefreshTokens(user._id);

    const options={
        httpOnly:true,
        secure:true
    }

    res.status(200).cookie("accessToken",accessToken,options).cookie("refereshToken",newrefreshToken,options).json(
        new ApiResponse(
            200,

            {
                accessToken, refreshToken : newrefreshToken
    
            },
            "Access token refreshed"
        )
    )
});



const updatePassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;

   const user= await User.findById(req.user?._id);

   if(!user){
    throw new ApiError(400, "user not found")
   }
   const verifyPassword=await user.isPasswordCorrect(oldPassword);
   if(!verifyPassword){
    throw new ApiError(400,"Invalid credentials")
   }
    user.password =newPassword;

    await user.save({validateBeforeSave:false});

    res.status(200).json(new ApiResponse(200,{},"Successfully updated "))


});


const currentUser=asyncHandler(async(req,res)=>{
    const user = req.user;
    if(!user){
        throw new ApiError(401, "User not authenticated")
    }
    res.status(200).json(new ApiResponse(200,{user},"Fetched current user"))

});


const UpdateUserDetail=asyncHandler(async(req,res)=>{
    const {fullName,username,email}=req.body;
    const user=await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                fullName,
                username,
                email
            }

            
        },{
            
                new: true,
                
            
        }
    )

    if (!user){
        throw new ApiError(400, "user not found")
    }

    user.save({validateBeforeSave:false})

    res.status(200).json(new ApiResponse(200,user,"Successfully updated user details"))




    

});

const updateUserAvatar= asyncHandler(async(req,res)=>{
    const file=req.file?.path;
    if(!file){
        throw new ApiError(400, "No file uploaded")
    }

    const avatarImg=await uploadfileonCloud(file);
    if(!avatarImg.url){
        throw new ApiError(400, "Failed to upload avatar")
    }

   const user=await User.findByIdAndUpdate(
    req.user._id,{
        $set:{
            avatar:avatarImg.url
        }},{
            
                new: true,
            
        }
   )

    if(!user){
        throw new ApiError(400, "User not found")
    }
    
    
    res.status(200).json(new ApiResponse(200,user,"Successfully updated user avatar"))

    
});


const updateUserCOVER= asyncHandler(async(req,res)=>{
    const file=req.file?.path;
    if(!file){
        throw new ApiError(400, "No file uploaded")
    }

    const COVERImg=await uploadfileonCloud(file);
    if(!COVERImg.url){
        throw new ApiError(400, "Failed to upload avatar")
    }

   const user=await User.findByIdAndUpdate(
    req.user._id,{
        $set:{
            coverImage:COVERImg.url
        }},{
            
                new: true,
            
        }
   )
   
    if(!user){
        throw new ApiError(400, "User not found")
    }
    
    
    res.status(200).json(new ApiResponse(200,user,"Successfully updated user avatar"))

    
})



export  {
    registerUser,
    loginUser,
    logout,
    RefereshAccessToken,
    updatePassword,
    currentUser,
    UpdateUserDetail,
    updateUserAvatar,
    updateUserCOVER
};