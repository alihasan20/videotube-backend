import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/couldinary.js";
import { User } from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
  //first time (i.e. sign up) we have form through which we get data of user frontend.
  //validation - not empty.
  //check if user already exists.
  //check for images, check for avatar.
  //then store it in db (mongoDb and postman).
  //upload them to cloudinary, avatar.
  //create user object - create entry in db.
  //remove password and refresh token field from response.
  //check for user creation.
  // return res.
  //after that user can login since we have users credential.
  // console.log("Files received by Multer:", req.files);

  const { fullName, email, username, password } = req.body; // console.log("email: ", email, fullname, password, username);

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username is already exist");
  } // FIX: This line now correctly uses optional chaining to prevent the TypeError
  console.log(req.files);

  const avatarLocalPath = req.files.avatar?.[0]?.path;
  const coverImageLocalPath = req.files.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath); // FIX: This is the corrected check. It now provides a more specific error
  // if the upload to Cloudinary fails, rather than a misleading "file is required" message.
  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar to Cloudinary");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});
export { registerUser};
