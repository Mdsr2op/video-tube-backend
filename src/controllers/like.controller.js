import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    const videoLike = await Like.findOne({
        $and:[
            {
                video: videoId
            },
            {
                likedBy: req.user?._id
            }
        ]
    })

    console.log(videoLike)
    if(typeof videoLike === 'object' && videoLike !== null){
        const unlikeStatus = await Like.deleteOne({
            _id: videoLike._id
        })

        if(unlikeStatus.acknowledged !== true){
            throw new ApiError(400, "Failed to unlike the video")
        }

        return res
        .status(200)
        .json( new ApiResponse(200, {}, "Video successfully unliked"))
    }

    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json( new ApiResponse(200, newLike, "Video successfully liked"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    const commentLike = await Like.findOne({
        $and:[
            {
                comment: commentId
            },
            {
                likedBy: req.user?._id
            }
        ]
    })
    console.log(commentLike)

    if(typeof commentLike === 'object' && commentLike !== null){
        const unlikeStatus = await Like.deleteOne({
            _id: commentLike._id
        })

        if(unlikeStatus.acknowledged !== true){
            throw new ApiError(400, "Failed to unlike the comment")
        }

        return res
        .status(200)
        .json( new ApiResponse(200, {}, "Comment successfully unliked"))
    }

    const newLike = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json( new ApiResponse(200, newLike, "Comment successfully liked"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    const tweetLike = await Like.findOne({
        $and:[
            {
                tweet: tweetId
            },
            {
                likedBy: req.user?._id
            }
        ]
    })

    if(typeof tweetLike === 'object' && tweetLike !== null){
        const unlikeStatus = await Like.deleteOne({
            _id: tweetLike._id
        })

        if(unlikeStatus.acknowledged !== true){
            throw new ApiError(400, "Failed to unlike the tweet")
        }

        return res
        .status(200)
        .json( new ApiResponse(200, {}, "Tweet successfully unliked"))
    }

    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res
    .status(200)
    .json( new ApiResponse(200, newLike, "Tweet successfully liked"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await Like.aggregate([
        {
          $match: {
            $and: [
              {
                video: {
                  $exists: true,
                },
              },
              {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
              },
            ],
          },
        },
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "video",
          },
        },
        {
          $addFields: {
            video: {
              $arrayElemAt: ["$video", 0],
            },
          },
        },
        {
            $sort:{
                "createdAt": -1
            }
        }
      ])

      if(typeof likedVideos === undefined ){
        throw new ApiError(400, "Could not fetch liked vidoes")
      }

      return res
      .status(200)
      .json( new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}