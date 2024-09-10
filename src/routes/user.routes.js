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
router.route("/change-password").post(verifyJWT,updatePassword);
router.route("/current-user").post(verifyJWT,currentUser);
router.route("/update-user-details").patch(verifyJWT,updateUserDetails);

router.route("/update-user-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/update-user-cover").patch(verifyJWT, upload.single("coverImage"), updateUserCover);

router.route("/c/:username").post(verifyJWT, channelSubscribers)

router.route("/watch-History").post(verifyJWT,getWatchHistory) 


export default router;