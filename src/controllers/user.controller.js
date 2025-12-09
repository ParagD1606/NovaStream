import {asyncHandler} from "../utils/asyncHandler.js";    //check if error here
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async ( userId)=>{
    try{
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullname, password } = req.body;
    console.log("email:", email);

    if([username, email, fullname, password].some((field) => field?.trim() === '')){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    });

    if(existedUser){
        throw new ApiError(409, "User with given username or email already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }

    const avatarUrl = await uploadToCloudinary(avatarLocalPath);
    // const coverImageUrl = await uploadToCloudinary(coverImageLocalPath);

    let coverImageUrl;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageUrl = req.files.coverImage[0].path;
    }

    if(!avatarUrl){
        throw new ApiError(500, "Failed to upload avatar image");
    }

    const user = await User.create({
        fullname,
        avatar: avatarUrl.url,
        coverImage: coverImageUrl?.url || '',
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select('-password -refreshToken');

    if(!createdUser){
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(new ApiResponse(201, "User registered successfully", createdUser));

});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if(!password || ( !email && !username )){
        throw new ApiError(400, "Email or username and password are required");
    }

    await User.findOne({
        $or: [{username}, {email}]
    })

    if(!User){
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await User.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(User._id)
    
    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200,{}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is missing");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await user.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Expird or used Refresh token")
    }

    const  options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await user.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "invalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, "password changed successfuly"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body  
    if(!fullName || !email){
        throw new ApiError(400, "All fields required")
    }

    const user = awaitUser.findByIdAndUpdate(req.user?._id, {$set: {
        fullName: fullName, email: email
    }}, {new: true}).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res)=>{
    const avatarLocalPath = req.file?.path

    if(! avatarLocalPath){
        throw new ApiError(400, "Avatar file missing");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(req.user._id, {$set:{avatar: avatar.url}}, {new: true}).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "avatyar image updated"))
})

const updateUserCover = asyncHandler(async (req, res)=>{
    const coverLocalPath = req.file?.path

    if(! coverLocalPath){
        throw new ApiError(400, "cover file missing");
    }

    const coverImage = await uploadToCloudinary(coverLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover img");
    }

    const user = await User.findByIdAndUpdate(req.user._id, {$set:{coverImage: cover.url}}, {new: true}).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "cover image updated"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
})

export { registerUser, getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCover };