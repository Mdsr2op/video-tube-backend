class ApiResponse{
    constructor(statusCode, data, message= "success",fileBytes = {}){
        this.statusCode = statusCode,
        this.data = data,
        this.message = message,
        this.success = statusCode < 400,
        this.fileBytes = fileBytes
    }
}

export {ApiResponse}