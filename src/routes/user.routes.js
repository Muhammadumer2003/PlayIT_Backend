import {Router} from "express";
import {registerUser, loginUser, logout, RefereshAccessToken } from "../controllers/register.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser);


router.route("/login").post(loginUser);

//secure route

router.route("/logout").post(verifyJWT, logout);
router.route("/referesh-token").post( RefereshAccessToken);


export default router;