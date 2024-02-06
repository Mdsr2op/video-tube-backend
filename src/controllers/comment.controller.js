import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const options = {
        page,
        limit
    }

    const commentsAggregate = Comment.aggregate([
        {
            $match:{
                "video": new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        }
    ])

    const response = await Comment.aggregatePaginate(commentsAggregate, options)

    if(!response){
        throw new ApiError(500, "Failed to apply pagination")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, response, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body

    if(!videoId){
        throw new ApiError(400, "Video id not recieved")
    }
    if(!content){
        throw new ApiError(400, "No content found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    return res
    .status(201)
    .json( new ApiResponse(201, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
   const {commentId} = req.params
   const {content} = req.body

    if(!commentId){
       throw new ApiError(400, "Comment id not recieved")
    }
    
    if(!content){
        throw new ApiError(404, "No content found")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(req.user?._id.toString() !== comment.owner.toString()){
        throw new ApiError(400, "User not authorized")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment._id,
        {
            $set:{
                content
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json( new ApiResponse(200, updatedComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
 
    if(!commentId){
       throw new ApiError(400, "Comment id not recieved")
    }
 
    const comment = await Comment.findById(commentId)
 
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
 
    if(req.user?._id.toString() !== comment.owner.toString()){
        throw new ApiError(400, "User not authorized")
    }

    const deleteStatus = await Comment.deleteOne({
        _id: comment._id
    })

    if(deleteStatus.acknowledged !== true){
        throw new ApiError(500, "Failed delete the comment")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }