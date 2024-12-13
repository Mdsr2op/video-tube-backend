import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name){
        throw new ApiError(400, "Name is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        video: [],
        owner: req.user?._id
    })

    return res
    .status(200)
    .json( new ApiResponse(200, playlist, "Playlist created successfully!"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId){
        throw new ApiError(404, "Id not recieved")
    }

    const playlists = await Playlist.find(
        {
            owner: userId
        }
    )

    if(playlists === undefined){
        throw new ApiError( 400, "Failed to fetch playlists")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(404, "Id not recieved")
    }

    const playlist = await Playlist.findById(
        playlistId
    )

    if(!playlist){
        throw new ApiError(400, "Failed to fetch the playlist")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!(playlistId && videoId)){
        throw new ApiError(404, "Both IDs are required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist does not exist")
    }


    const video = await Video.findById(videoId).select({
        thumbnail: 1,
        title: 1,
        _id: 1
      })

    if(!video){
        throw new ApiError(400, "Video does not exist")
    }

    const initialLength = playlist.videos.length;
    playlist.videos.push(video)

    if(initialLength === playlist.videos.length){
        throw new ApiError(400, "Failed to add the video")
    }

    await playlist.save({ validteBeforeSave: true })

    return res
    .status(200)
    .json( new ApiResponse(200, playlist.videos, "Video added successfully")) 

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!(playlistId && videoId)){
        throw new ApiError(404, "Both IDs are required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist does not exist")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video does not exist")
    }

    const initialLength = playlist.videos.length;

    const index = playlist.videos.indexOf(video._id)
    playlist.videos.splice(index, 1)

    if(initialLength === playlist.videos.length){
        throw new ApiError(400, "Failed to remove the video")
    }

    await playlist.save({ validteBeforeSave: true })

    return res
    .status(200)
    .json( new ApiResponse(200, playlist.videos, "Video removed successfully")) 
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(404, "Id not recieved")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist does not exist")
    }

    if(playlist?.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "User not authorized")
    }
    
    const deleteStatus = await Playlist.deleteOne({
        _id: playlistId
    })

    if(deleteStatus.acknowledged !== true){
        throw new ApiError(400, "Failed to delete the playlist")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Playlist deleted successfully") )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId){
        throw new ApiError(404, "Id not recieved")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist does not exist")
    }

    if(playlist?.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "User not authorized")
    }

    if(!name){
        throw new ApiError(400, "Name is required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist._id,
        {
            $set:{
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(400, "Failed to find and update the playlist")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}