import { Request, Response, NextFunction, RequestHandler } from "express";

const asyncHandler = (requestHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
export default asyncHandler;

//js implementation

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//    if (typeof error === 'object' && error !== null && 'message' in error) {
//     const err = error as { code?: number; message: string };
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   } else {
//     res.status(500).json({
//       success: false,
//       message: 'An unknown error occurred',
//     });
//   }
// };
// }

//ts implementation

// import { Request, Response, NextFunction } from 'express';

// const asyncHandler = (
//   fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
// ) => async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     if (typeof error === 'object' && error !== null && 'message' in error) {
//       const err = error as { code?: number; message: string };
//       res.status(err.code || 500).json({
//         success: false,
//         message: err.message,
//       });
//     } else {
//       res.status(500).json({
//         success: false,
//         message: 'An unknown error occurred',
//       });
//     }
//   }
// };

// export default asyncHandler;
