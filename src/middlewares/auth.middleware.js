import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import jwt from "jsonwebtoken";

export const verifyJWT=asyncHandler(async(req,_,next)=>{

    try {
        const Token=req.cookie.accessToken || req.Header?.("Authorization")?.replace("Bearer ","");
        if(!Token) {
            throw new ApiError(401,"Invalid token");
        }
    
        const decodeToken=jwt.verify(Token,process.env.ACCESS_TOKEN_SCRET);
    
        const user=await User.findById(decodeToken._id).select("-password -refreshToken");
    
        if(!user){
            //frontend discussion
            throw new ApiError(401,"User not found");
        }

        req.user=user;
        next();

    //    const token= req.cookie?.accessToken || req.Header?.('Authorization').replace("Bearer ","");
    //    if(!token) {
    //     throw new ApiError(401,"Invalid token");
    //    }

    //    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SCRET);

    //    if(!decodedToken){
    //     throw new ApiError(401,"Have to log in first")
    //    }
    //    const user= await User.findById(decodedToken?._id).select("-password -refreshToken");

    //    req.user=user

    //    next();

    
    } catch (error) {
        console.log("Error occured");
        
    }

})