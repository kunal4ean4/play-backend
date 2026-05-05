class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong",
        errors=[],
        stack = ""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
        this.errors = errors 

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}
/*
this.statusCode = statusCode?
Example:
const err = new ApiError(404, "User not found");

err = {
  statusCode: 404,
  message: "User not found",
  success: false
}

🎯 Final Summary (Very Important)
Concept	Why
statusCode =>	You pass it while throwing error
this.statusCode	=> Stores it inside object
super(message) =>	Initializes built-in Error class


*/