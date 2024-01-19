import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponce } from '../utils/ApiResponse.js'
import mongoose from 'mongoose'





//  generate access and refresh token

const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

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
    console.log(email)
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    // if (!(username || email)) {
    //     throw new ApiError(400, "Username or email is required ")

    // }

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

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

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
            $unset: {
                refreshToken: 1
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
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponce(200, {}, "User Logged Out Successfully"))
})


// refresh token

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get incomin refreshtoken through the req.body   or cookies

    const incomingrefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingrefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {

        const decodedToken = Jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if (incomingrefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expire and Used")

        }
        const option = {
            httpOnly: true,
            secure: true
        }

        // again generate refresh token

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", newRefreshToken, option)
            .json(
                new ApiResponce(200, { accessToken, refreshToken: newRefreshToken }, "Access Token Refreshed")
            )


    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {

        throw new ApiError(400, "Invalid old Password")

    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })


    return res.
        status(200)
        .json(new ApiResponce(200, {}, "Password is change Successfully "))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.
        status(200)
        .json(200, req.user, "Current User Fetched Succesfully")
})


const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullname, email } = req.body

    if (!fullname || !email) {

        throw new ApiError(400, "All feild are required")
    }


    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")


    return res
        .status(200)
        .json(new ApiResponce(200, user, "Account Details updated Succesfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {

        throw new ApiError(400, "Avatr file is missing")

    }

    const avatar = await User.uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on Avatr")
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")


    return res
        .status(200)
        .json(new ApiResponce(200, user, "Avatar is Upadted"))
})


const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {

        throw new ApiError(400, "coverImage file is missing")

    }

    const coverImage = await User.uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover Image")
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")


    return res
        .status(200)
        .json(new ApiResponce(200, user, "cover Image is Upadted"))
})


// user aggregation pipline

const getUserChannelProfile = asyncHandler(async (req, res) => {


    // get username through params

    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    // aggreagate

    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscription", // kon se modal mese aaya
                    localField: "_id",   // kya name hai modal k field ka for join
                    foreignField: "channel", // samne vale model me kya name hai uska
                    as: "subscribers"  // name of  object
                }
            },
            {
                $lookup: {
                    from: "subscription",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelIsSusbcribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelIsSusbcribedToCount: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1

                }
            }
        ]
    )
    console.log(channel)

    if (!channel?.length) {
        throw new ApiError(404, "Channel is does not Exits ")
    }

    return res
        .status(200)
        .json(new ApiResponce(200, channel[0], "User channel is fetched Successfully"))
})



// aggregation pipeline for watch histrory

const getWatchHistory= asyncHandler(async(req,res)=>{

    const user= await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchhistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])


    return res
    .status(200)
    .json(

        new ApiResponce(
            200,
            user[0].watchhistory,
            "Watch History fetched Successfully"
        )
      
    )

})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory


} 