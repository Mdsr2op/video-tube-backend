import mongoose from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "no content found")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    return res
    .status(201)
    .json( new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if(!userId){
        throw new ApiError(400, "Id not recieved")
    }

    const tweet = await Tweet.find(
        {
            owner: userId
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if(!tweetId){
        throw new ApiError(400, "Id not recieved")
    }
    const tweet = await Tweet.findById(tweetId)

    if(req.user?._id.toString() !== tweet.owner.toString()){
        throw new ApiError(400, "User not authorized")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweet._id,
        {
            $set:{
                content,
            }
        },
        {
            new: true
        }
    )

    return res
    .status(201)
    .json( new ApiResponse(201, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!tweetId){
        throw new ApiError(400, "Id not recieved")
    }
    const tweet = await Tweet.findById(tweetId)

    if(req.user?._id.toString() !== tweet.owner.toString()){
        throw new ApiError(400, "User not authorized")
    }

    const deleteStatus = await Tweet.deleteOne({
        _id: tweet._id
    })

    if(deleteStatus.acknowledged !== true){
        throw new ApiError(500, "Failed delete the video")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}