import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponce } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {

    // step 1 get user details from frontend

    const { fullname, email, username, password } = req.body
    console.log("email:", email);

    // validation for empty
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required ")
    }

    //  check user already exits or not through email and username
    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existUser) {

        throw new ApiError(409, " User with mail and username  already exists")

    }


    // check image and check avatar 

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath)
    // const coverImageLocalpath = req.files?.coverImage[0]?.path;

    let coverImageLocalpath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0)
    {
         coverImageLocalpath=req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, " Avtar file is can required")

    }

    // upload on cloudinary of image

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalpath)
    console.log(coverImage);
    console.log(avatar)
    if (!avatar) {
        throw new ApiError(401, " Avtar file is required")
    }

    // create user

    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()

        }

    )
    console.log(user);

    //remove password and refreshtoken feild from response

    const createUser = await User.findById(user._id).select(
        " -password -refreshToken "
    )

    // check user create

    if (!createUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return response

    return res.status(201).json(
        new ApiResponce(200, createUser, "User Registered Successfully ")
    )
})


export { registerUser } 