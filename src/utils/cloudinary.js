import {v2 as cloudinary} from "cloudinary";
import { log } from "console";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:  process.env.CLOUDINARY_SECRET
});


const uploadfileonCloud=async(localfilepath)=>{
    try {

        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        });
        console.log(response.url);
        return response;


        
    } catch (error) {
        fs.unlinkSync(localfilepath);
        return null;
        
    }

}


export default uploadfileonCloud;