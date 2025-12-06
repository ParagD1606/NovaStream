import {asyncHandler} from "../utils/asyncHandler.js";    //check if error here

const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "User registered successfully"
    });
})

export { registerUser };