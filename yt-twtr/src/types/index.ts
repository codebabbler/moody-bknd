import { Document, Types, AggregatePaginateModel } from "mongoose";
import { Request } from "express";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  watchHistory: Types.ObjectId[];
  password: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface IVideo extends Document {
  _id: Types.ObjectId;
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoModel extends AggregatePaginateModel<IVideo> {}

export interface ITweet extends Document {
  _id: Types.ObjectId;
  content: string;
  user: Types.ObjectId;
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment extends Document {
  _id: Types.ObjectId;
  content: string;
  video?: Types.ObjectId;
  tweet?: Types.ObjectId;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILike extends Document {
  _id: Types.ObjectId;
  video?: Types.ObjectId;
  comment?: Types.ObjectId;
  tweet?: Types.ObjectId;
  likedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  subscriber: Types.ObjectId;
  channel: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlaylist extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  videos: Types.ObjectId[];
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUserRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginUserRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  username?: string;
  email?: string;
}

export interface CreateVideoRequest {
  title: string;
  description: string;
  duration: number;
  isPublished?: boolean;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

export interface CreateTweetRequest {
  content: string;
}

export interface UpdateTweetRequest {
  content: string;
}

export interface CreateCommentRequest {
  content: string;
  video?: string;
  tweet?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// Authenticated request type using intersection
export type AuthenticatedRequest = Request & {
  user: IUser; // Required user property
}

// Typed authenticated request with body
export type AuthenticatedRequestWithBody<T = any> = Request & {
  user: IUser;
  body: T;
}

// Typed authenticated request with params  
export type AuthenticatedRequestWithParams<T = any> = Request & {
  user: IUser;
  params: T;
}

// Combined authenticated request with body and params
export type AuthenticatedRequestWithBodyAndParams<B = any, P = any> = Request & {
  user: IUser;
  body: B;
  params: P;
}

// Helper type for creating specific authenticated request types
export type CreateAuthenticatedRequest<Body = any, Params = any, Query = any> = Request & {
  user: IUser;
  body: Body;
  params: Params;
  query: Query;
}

export interface TokenPayload {
  _id: string;
  email?: string;
  username?: string;
  fullName?: string;
}

export interface ApiResponseData<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  secure_url: string;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface MulterFiles {
  [fieldname: string]: FileUpload[];
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  maxAge?: number;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
}

export interface AggregationResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}