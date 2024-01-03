import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js"; 
// default export na kro to import ni syntax aavi rese

const router= Router()

router.route('/register').post(registerUser)

export default router  // if you can deafute export then you import any name through the fun