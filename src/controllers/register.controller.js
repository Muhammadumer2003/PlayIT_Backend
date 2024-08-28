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

    const emailVerify=await User.findOne({email});

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

    res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,
            {user:
                loggedInUser,accessToken,refreshToken},
            "User logged in successfully")
    );









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
export  {registerUser,loginUser,logout};