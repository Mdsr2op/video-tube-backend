import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {

        // Simulate a database connection check
        const dbConnection = false; // Replace with actual DB connection check
        if (!dbConnection) {
               throw new ApiError(500, "Database connection failed");
        }
     return res
     .status(200)
     .json( new ApiResponse(200, {}, "Everything is alirght!"))
})

export {
    healthcheck
    }
    