import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken'

const verifyJWT = asyncHandler(async(req, _, next) =>{
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ","")
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    if(!decodedToken){
        throw new ApiError(401, "Invalid Access token")
    }
   
    const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken"
    )

    if(!user){
        throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user;
    next()
})

export default verifyJWT 