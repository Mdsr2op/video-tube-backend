import mongoose from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    //my approach:
    // bring in the current user
    // check the user's subscription status
    // delete the subscription document if it was true and set it to false
    // else
    // create a new document and set the status to false
    
    const channel = await User.findById(channelId).select("-refreshToken -password")

    if(!channel){
        throw new ApiError(404, "Channel does not exist")
    }

    const user = await User.findById(req.user._id).select("-refreshToken -password")

    const subscription = await Subscription.findOne({
        $and: [
            {
                subscriber: user._id
            },
            {
                channel: channelId
            }
        ]
    })

    if(subscription){
        const deleteStatus = await Subscription.deleteOne(
            {
                _id : subscription._id
            }
        )

        if(deleteStatus.acknowledged !== true){
            throw new ApiError(400, "Failed to unsubscribe the channel")
        }

        return res
        .status(201)
        .json(
            new ApiResponse(201, {}, "Unsubscribed successfully")
        )
    }

    if(user._id.toString() === channelId.toString()){
        throw new ApiError(400, "Self subscription not possible")
    }

    const newSubscription = await Subscription.create({
        subscriber: user._id,
        channel: channelId
    })

    if(!newSubscription){
        throw new ApiError(400, "Failed to subscribe to the channel")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201, newSubscription, `Successfully subscribed to ${channel.username}`)
    )
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // get the current channel 
    // get subscription documents where channel is the channelId
    // display username, avatar and id properties of each document

    const {channelId} = req.params

    const channel = await User.findById(channelId).select("-refreshToken -password")

    if(!channel){
        throw new ApiError(404, "Channel does not exist")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                "channel": new mongoose.Types.ObjectId(channel._id)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            avatar: 1,
                            fullname: 1
                        }
                    }
                ]
            }
        },
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    console.log("myid:" +subscriberId);

    if(!subscriberId){
        throw new ApiError(400, "Id not recieved")
    }

    const subscriber = await User.findById(subscriberId).select("-password -refreshToken")

    if(!subscriber){
        throw new ApiError(404, "Subscriber does not exist")
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                "subscriber": new mongoose.Types.ObjectId(subscriber._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscriptions",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullname: 1
                        }
                    }
                ]
            }
        },
    ])

    return res
    .status(200)
    .json( new ApiResponse(200, subscriptions, "Subscriptions fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}