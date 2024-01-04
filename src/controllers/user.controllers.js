import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponce } from '../utils/ApiResponse.js'





//  generate access and refresh token

const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Token")
    }

}
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
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalpath = req.files.coverImage[0].path
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


// login users


const loginUser = asyncHandler(async (req, res) => {

    // 1 . request boy to get Data
    const { username, email, password } = req.body

    // find username or email

    if (!username || !email) {
        throw new ApiError(400, "Username or email is required ")

    }

    // find user

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not found")
    }

    // check password

    const isPasswordValid = await user.isPasswordCorrect(password)  // this method define in model

    if (!isPasswordValid) {

        throw new ApiError(400, "Password is required")

    }

    // access and refresh token

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._Id)

    const loggedInUser = await User.findById(user._Id).select(
        "-password -refreshToken"
    )

    // cookies

    const option = {
        httpOnly: true,
        secure: true
    }


    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            200,
            {
                user: loggedInUser, accessToken, refreshToken

            },
            "User LoggedIn Successfully "
        )


})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }

    )
    
    const option = {
        httpOnly: true,
        secure: true
    }


    return res
    .status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponce(200,{},"User Logged Out Successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser

} 