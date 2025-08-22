import { Request } from 'express';
import { AuthObject } from '@clerk/clerk-sdk-node';
import { User } from '@clerk/clerk-sdk-node';
import { IUser } from './user.types';

export interface AuthenticatedRequest extends Request {
  auth?: AuthObject;
  userEmail?: string;
  userClerkId?: string;
  clerkUser?: User;
  dbUser?: IUser;
  userId?: string;
}