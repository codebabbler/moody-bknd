import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";

const healthCheck = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, null, "Health check successfully passed"));
});

export default healthCheck;
