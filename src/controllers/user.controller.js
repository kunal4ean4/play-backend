import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

//Access and refresh token reusable code
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token",
    );
  }
};

// Registered user
const registerUser = asyncHandler(async (req, res) => {
  // Below are the plans to develop Register user:
  //Get user details from frontend
  // Validation - not empty
  // check if user alredy exists: username, email
  // check for images and avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullname, username, email, password } = req.body;
  console.log("email:", email);
  //// Validation - not empty
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user alredy exists: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // console.log(req.files)

  // check for images and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

// User logged in
const loginUser = asyncHandler(async (req, res) => {
  //req body ->data
  const { email, username, password } = req.body;

  //username or email
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  //find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const{accessToken, refreshToken} =await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: false
  }
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully"
    )
  )

});

// User logged out
const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,{
      $set:{
        refreshToken: undefined
      }
    },{
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: false
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out"))
})

//generate refresh token
const refreshAccessToken=asyncHandler(async(req,res)=>{

  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
  if(incomingRefreshToken){
    throw new ApiError(401, "Unauthorised request")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(user){
      throw new ApiError(401,"Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refres token is expired or used")
    }

    const options={
      httpOnly: true,
      secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newRefreshToken},
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})


export { registerUser, loginUser, logoutUser, refreshAccessToken };
