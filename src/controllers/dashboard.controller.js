import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import { Tweet } from "../models/tweet.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const viewCount = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
          $group: {
            _id: null,
            totalViews:{
              $sum: "$views"
            }
          }
        }
      ])


    
    const totalSubscribers = await Subscription.aggregate([
        {
          $match:{
            channel: new mongoose.Types.ObjectId(req.user?._id)
          }
        },
        {
          $count: "subscribers"
        }
      ])
    
    
      const totalVideos = await Video.aggregate([
        {
          $match:{
            owner: new mongoose.Types.ObjectId(req.user?._id)
          }
        },
        {
          $count: "videos"
        }
      ])

      // get videos where user is the owner
      // same for tweets
      // same for comments
      // get likes for each video
      // same for tweets
      // same for comments
      // count all of those likes
      
      const videoLikes = await Video.aggregate([
        {
          $match:{
            owner: new mongoose.Types.ObjectId(req.user._id)
          }
        },
        {
          $lookup:{
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "likes"
          }
        },
        {
          $addFields: {
            likes: { $size: "$likes"}
          }
        },
        {
          $group: {
            _id: null,
            likes:{
              $sum: "$likes"
            }
          }
        }
      ])


      const tweetLikes = await Tweet.aggregate([
        {
          $match:{
            owner: new mongoose.Types.ObjectId(req.user._id)
          }
        },
        {
          $lookup:{
            from: "likes",
            localField: "_id",
            foreignField: "tweet",
            as: "likes"
          }
        },
        {
          $addFields: {
            likes: { $size: "$likes"}
          }
        },
        {
          $group: {
            _id: null,
            likes:{
              $sum: "$likes"
            }
          }
        }
      ])

      const commentLikes = await Comment.aggregate([
        {
          $match:{
            owner: new mongoose.Types.ObjectId(req.user._id)
          }
        },
        {
          $lookup:{
            from: "likes",
            localField: "_id",
            foreignField: "comment",
            as: "likes"
          }
        },
        {
          $addFields: {
            likes: { $size: "$likes"}
          }
        },
        {
          $group: {
            _id: null,
            likes:{
              $sum: "$likes"
            }
          }
        }
      ])


     const totalLikes = videoLikes[0].likes + commentLikes[0].likes + tweetLikes[0].likes


     return res
     .status(200)
     .json(
        new ApiResponse(
            200, 
            {
                viewCount: viewCount[0].totalViews,
                subscriberCount: totalSubscribers[0].subscribers,
                videoCount: totalVideos[0].videos,
                totalLikes
            }
            )
     )


      
})

const getChannelVideos = asyncHandler(async (req, res) => {

    const videos = await Video.aggregate([
        {
            $match:{
                owner: req.user?._id
            }
        },
        {
            $sort:{
                "createdAt": -1
            }
        }
    ])

    if(videos === undefined){
        throw new ApiError(400, "Failed to fetch the videos")
    }

    return res
    .status(200)
    .json( new ApiResponse( 200, videos, "Videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }