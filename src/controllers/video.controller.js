import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
// import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js" 
import { uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary} from '../utils/Cloudinary.js'


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    const options = {
        page,
        limit,
    }

    const video = Video.aggregate(
        [
            {
                $match:{
                    "owner": new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $sort:{
                    [sortBy || "createdAt"]: sortType === '-1' ? -1 : 1
                }
            }
        ]
    )

    const response = await Video.aggregatePaginate(video, options)

    if(!response){
        throw new ApiError(500, "Failed to apply pagination")
    }


    return res
    .status(200)
    .json(
        new ApiResponse(200, response, "All videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    //get video path
    const videoExists = req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0
    
    if(!videoExists){
        throw new ApiError(404, "Video not recieved")
    }
    const videoPath = req.files.videoFile[0].path

    //get thumbnail path
    const thumbnailExists = req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0
    
    if(!thumbnailExists){
        throw new ApiError(404, "Thumbnail not found")
    }
    const thumbnailPath = req.files.thumbnail[0].path

    //upload both on cloudinary
    const videoFile = await uploadOnCloudinary(videoPath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!videoFile.url || !thumbnail.url){
        throw new ApiError(500, "Error encountered while uploading the image")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video uploaded successfully!")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Id not recieved")
    }
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video fetched successfully!")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body
    const thumbnailPath = req.file?.path

    const video = await Video.findById(videoId)

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "User not authorized")
    }

    if(!title || !description){
        throw new ApiError(400, "All fields are required")
    }

    if(!thumbnailPath){
        throw new ApiError(400, "Thumbnail not recieved")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailPath)
    console.log(`upload response:`)
    console.log(thumbnail)

    if(!thumbnail.url){
        throw new ApiError(500, "Error while uploading the thumbnail")
    }

    const oldThumbnail = video.thumbnail
    const deleteStatus = await deleteFromCloudinary(oldThumbnail)

    if(!deleteStatus){
        throw new ApiError(500, "Failed to delete the old thumbnail")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        {
            _id: video._id
        },
        {
            $set:{
                title,
                description,
                thumbnail: thumbnail.url
            },
        },
        {
            new: true
        }
    )
    
   
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video details updated successfully!")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Id not received")
    }
    
    const video = await Video.findById(videoId)

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "User not authorized")
    }

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const videoDeleteStatus = await deleteVideoFromCloudinary(video.videoFile)
    const thumbnailDeleteStatus = await deleteFromCloudinary(video.thumbnail)

    if(!videoDeleteStatus && !thumbnailDeleteStatus){
        throw new ApiError(500, "Failed to delete video file from the server")
    }
    if(!thumbnailDeleteStatus){
        throw new ApiError(500, "Failed to delete the thumbnail from the server")
    }

    const deleteStatus = await Video.deleteOne({_id: videoId})

    if(deleteStatus.acknowledged !== true){
        throw new ApiError(500, "Failed to find or delete the video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "User not authorized")
    }

    if(!video){
        throw new ApiError(404, "Video not found.")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        {
            new: true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, `Publish status changed successfully to ${updatedVideo.isPublished}`)
    )
    
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}