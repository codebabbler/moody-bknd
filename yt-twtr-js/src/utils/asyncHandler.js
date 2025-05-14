const asyncHandler = (requeestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requeestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export default asyncHandler;
