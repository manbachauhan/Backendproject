import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js"; 
import { upload } from "../middlewares/multer.middlewares.js"
// default export na kro to import ni syntax aavi rese

const router= Router()

router.route('/register').post(
    
        upload.fields([
            {
                 name:"avtar",
                 maxCount:1
            },
            {
                  name:"coverImage",
                  maxCount:1
            }
        ]) ,
        registerUser)

export default router  // if you can deafute export then you import any name through the fun