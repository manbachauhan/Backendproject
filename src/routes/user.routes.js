import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controllers.js"; 
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
// default export na kro to import ni syntax aavi rese

const router= Router()

router.route('/register').post(
    
        upload.fields([
            {
                 name:"avatar",
                 maxCount:1
            },
            {
                  name:"coverImage",
                  maxCount:1
            }
        ]) ,
        registerUser)


router.route('/login').post(loginUser)

router.route('/logout').post(verifyJWT,logoutUser)
export default router  // if you can deafute export then you import any name through the fun