/*
This asyncHandler utility is commonly written in the utils folder
 of a Node.js + Express backend to avoid repeatedly writing try-catch
blocks for every async API controller.
*/
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
