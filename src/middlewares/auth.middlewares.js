import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
try {
      // Get token from cookies OR Authorization header
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
      // If token not found, user is unauthorized
      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }
    
      // Verify and decode token
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      // Find user from DB
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken",
      );
    
      // If user not found
      if(!user){
        //Next: Discuss about frontend
        throw new ApiError(401,"Invalid Access Token")
      }
      req.user=user;
      next()
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
}
});
