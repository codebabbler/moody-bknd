import { IUser } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Optional for regular requests
    }
    
    // Interface for authenticated requests where user is guaranteed to exist
    interface AuthenticatedRequest extends Request {
      user: IUser; // Required for authenticated requests
    }
  }
}