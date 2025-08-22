import { Document } from 'mongoose';
export interface IUser extends Document {
    _id: string;
    clerkUserId?: string;
    username?: string;
    email: string;
    friendRequestsSent: string[];
    friendRequestsReceived: string[];
    friends: string[];
    password?: string;
    displayName?: string;
    roles: string[];
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    mostRecentLeague?: string;
    subscription?: {
        active: boolean;
        tier: string;
        startDate: Date;
        endDate: Date;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IUserRef {
    email: string;
    username: string;
}
//# sourceMappingURL=user.types.d.ts.map