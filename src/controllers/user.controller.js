import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import { User } from '../models/user.model.js'
import { uploadOnCloudinary, deleteFromCloudinary} from '../utils/Cloudinary.js'
import mongoose from 'mongoose'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave:false })


        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {

    //get user details
    //validate the data
    //check if user already exists
    //check for files
    //upload them to cloudinary, check avatar
    //create a user object - create entry in db
    //remove password and refresh token from the response that is being returned
    //check for user creation
    //return response

    const {fullname, username, email, password} = req.body
    console.log("email: "+email)

    if(
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    if(!email.includes('@')){
        throw new ApiError(400, "Invalid email format")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    console.log("request processed")

    if(existedUser){
        console.log(existedUser)
        throw new ApiError(409, "User already exists")
    }

    let avatarLocalPath;
    const avatarExists = req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0
    
    if (avatarExists){
        avatarLocalPath = req.files.avatar[0].path;
    }else{
        throw new ApiError(400, "Avatar file is required")
    }

    let coverImageLocalPath;
    const coverImageExists = req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0;
    if(coverImageExists){
        coverImageLocalPath = req.files.coverImage[0].path
     }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500, "Error encountered while uploading the avatar file")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler( async(req, res) =>{
      //get data from req object
      //validate data
      //check if the username/email exists in the database
      //check for password
      //grant access token and refresh token

      const {email, username, password} = req.body

      if(!email && !username){
        throw new ApiError(400, "username or email is required")
      }

      const user = await User.findOne({
        $or: [{username}, {email}]
      })

      if(!user){
        throw new ApiError(400, "User not found")
      }

      const isValidPassword = await user.isPasswordCorrect(password);

      if(!isValidPassword){
        throw new ApiError(401, "Incorrect password")
      }

      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)


      const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
      )

      const options = {
        httpOnly: true,
        secure: true
      }

      return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken, 
                        refreshToken
                    },
                    "User logged in successfully"
                )
            )


})

const logoutUser = asyncHandler( async(req, res)=>{
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

    const options ={
        httpOnly: true,
        secure: true
    }


    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User logged out successfully"))

})

const refreshAccessToken = asyncHandler( async(req, res) =>{
    const incomingRequest = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRequest){
        throw new ApiError(401, "unauthorized request")
    }
    const decodedToken = jwt.verify(
        incomingRequest,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }

    if(incomingRequest !== user?.refreshToken ){
        throw new ApiError(401, "Refresh token used or expired")
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.refreshToken;

    const options = {
        httpOnly: true,
        secure: true
    }

    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options )
    .json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken,
            },
            "Access token refreshed"
        )
    )
})

const changePassword = asyncHandler(async(req,res) =>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user._id);

    if(!oldPassword || !newPassword){
        throw new ApiError(400, "Both current and new password are required")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Incorrect password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"))
})

const getCurrentUser = asyncHandler( async(req, res) =>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler( async(req, res) =>{
    const {fullname, email} = req.body
    console.log("email: "+email)

    if(!fullname || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateAvatar = asyncHandler( async(req, res)=>{
    const newFile = req.file?.path;

    if(!newFile){
        throw new ApiError(400, "No file received")
    }


    const avatar = await uploadOnCloudinary(newFile);

    if(!avatar.url){
        throw new ApiError(500, "Error while uploading the avatar")
    }

    const user = await User.findById(req.user._id).select("-password")

    deleteFromCloudinary(user.avatar)

    user.avatar = avatar.url
    await user.save({ validateBeforeSave:false })

    res
    .status(200)
    .json( new ApiResponse(200, user, "avatar updated successfully"))
})

const updateCoverImage = asyncHandler( async(req, res) =>{
    const newImage = req.file?.path;

    if(!newImage){
        throw new ApiError(400, "Image not found")
    }

    const coverImage = await uploadOnCloudinary(newImage)

    if(!coverImage.url){
        throw new ApiError(500, "Error while uploading the image")
    }

    const user = await User.findById(req.user._id).select("-password")

    await deleteFromCloudinary(user.coverImage)

    user.coverImage = coverImage.url
    await user.save({ validateBeforeSave:false })

    res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getChannelProfile = asyncHandler( async(req, res) => {
    const { username } = req.params

    if(!username){
        throw new ApiError(400, "username not recieved")
    }

    const channel = await User.aggregate(
        [
            {
                $match: {
                    "username": username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
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
                    subscriptionsCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {$in: [new mongoose.Types.ObjectId(req.user._id), "$subscribers.subscriber"]},
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
                    subscriptionsCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
                }
            }
        ]
    )

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel fetched succcessfully")
    )
})

const getWatchHistory = asyncHandler( async(req, res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?.id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistroy",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getChannelProfile,
    getWatchHistory
    }