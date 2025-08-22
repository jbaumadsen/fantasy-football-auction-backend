export default UserToken;
declare const UserToken: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    scope: unknown[];
    localUserId?: unknown;
    provider?: unknown;
    access_token?: unknown;
    refresh_token?: unknown;
    expires_at?: {
        toJSON?: {} | null | undefined;
        [Symbol.toPrimitive]?: {} | null | undefined;
        toString?: {} | null | undefined;
        toLocaleString?: {} | null | undefined;
        toDateString?: {} | null | undefined;
        toTimeString?: {} | null | undefined;
        toLocaleDateString?: {} | null | undefined;
        toLocaleTimeString?: {} | null | undefined;
        getTime?: {} | null | undefined;
        getFullYear?: {} | null | undefined;
        getUTCFullYear?: {} | null | undefined;
        getMonth?: {} | null | undefined;
        getUTCMonth?: {} | null | undefined;
        getDate?: {} | null | undefined;
        getUTCDate?: {} | null | undefined;
        getDay?: {} | null | undefined;
        getUTCDay?: {} | null | undefined;
        getHours?: {} | null | undefined;
        getUTCHours?: {} | null | undefined;
        getMinutes?: {} | null | undefined;
        getUTCMinutes?: {} | null | undefined;
        getSeconds?: {} | null | undefined;
        getUTCSeconds?: {} | null | undefined;
        getMilliseconds?: {} | null | undefined;
        getUTCMilliseconds?: {} | null | undefined;
        getTimezoneOffset?: {} | null | undefined;
        setTime?: {} | null | undefined;
        setMilliseconds?: {} | null | undefined;
        setUTCMilliseconds?: {} | null | undefined;
        setSeconds?: {} | null | undefined;
        setUTCSeconds?: {} | null | undefined;
        setMinutes?: {} | null | undefined;
        setUTCMinutes?: {} | null | undefined;
        setHours?: {} | null | undefined;
        setUTCHours?: {} | null | undefined;
        setDate?: {} | null | undefined;
        setUTCDate?: {} | null | undefined;
        setMonth?: {} | null | undefined;
        setUTCMonth?: {} | null | undefined;
        setFullYear?: {} | null | undefined;
        setUTCFullYear?: {} | null | undefined;
        toUTCString?: {} | null | undefined;
        toISOString?: {} | null | undefined;
        getVarDate?: {} | null | undefined;
        valueOf?: {} | null | undefined;
    } | null | undefined;
    provider_user_id?: unknown;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    scope: unknown[];
    localUserId?: unknown;
    provider?: unknown;
    access_token?: unknown;
    refresh_token?: unknown;
    expires_at?: {
        toJSON?: {} | null | undefined;
        [Symbol.toPrimitive]?: {} | null | undefined;
        toString?: {} | null | undefined;
        toLocaleString?: {} | null | undefined;
        toDateString?: {} | null | undefined;
        toTimeString?: {} | null | undefined;
        toLocaleDateString?: {} | null | undefined;
        toLocaleTimeString?: {} | null | undefined;
        getTime?: {} | null | undefined;
        getFullYear?: {} | null | undefined;
        getUTCFullYear?: {} | null | undefined;
        getMonth?: {} | null | undefined;
        getUTCMonth?: {} | null | undefined;
        getDate?: {} | null | undefined;
        getUTCDate?: {} | null | undefined;
        getDay?: {} | null | undefined;
        getUTCDay?: {} | null | undefined;
        getHours?: {} | null | undefined;
        getUTCHours?: {} | null | undefined;
        getMinutes?: {} | null | undefined;
        getUTCMinutes?: {} | null | undefined;
        getSeconds?: {} | null | undefined;
        getUTCSeconds?: {} | null | undefined;
        getMilliseconds?: {} | null | undefined;
        getUTCMilliseconds?: {} | null | undefined;
        getTimezoneOffset?: {} | null | undefined;
        setTime?: {} | null | undefined;
        setMilliseconds?: {} | null | undefined;
        setUTCMilliseconds?: {} | null | undefined;
        setSeconds?: {} | null | undefined;
        setUTCSeconds?: {} | null | undefined;
        setMinutes?: {} | null | undefined;
        setUTCMinutes?: {} | null | undefined;
        setHours?: {} | null | undefined;
        setUTCHours?: {} | null | undefined;
        setDate?: {} | null | undefined;
        setUTCDate?: {} | null | undefined;
        setMonth?: {} | null | undefined;
        setUTCMonth?: {} | null | undefined;
        setFullYear?: {} | null | undefined;
        setUTCFullYear?: {} | null | undefined;
        toUTCString?: {} | null | undefined;
        toISOString?: {} | null | undefined;
        getVarDate?: {} | null | undefined;
        valueOf?: {} | null | undefined;
    } | null | undefined;
    provider_user_id?: unknown;
}, {}, {
    timestamps: true;
    versionKey: false;
    toJSON: {
        transform: (_doc: mongoose.Document<unknown, {}, mongoose.FlatRecord<{
            localUserId: string;
            provider: string;
            access_token: string;
            refresh_token: string;
            expires_at: NativeDate;
            scope: string[];
            provider_user_id?: string | null | undefined;
        }>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
            localUserId: string;
            provider: string;
            access_token: string;
            refresh_token: string;
            expires_at: NativeDate;
            scope: string[];
            provider_user_id?: string | null | undefined;
        }> & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        }, ret: mongoose.FlatRecord<{
            localUserId: string;
            provider: string;
            access_token: string;
            refresh_token: string;
            expires_at: NativeDate;
            scope: string[];
            provider_user_id?: string | null | undefined;
        }> & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        }) => mongoose.FlatRecord<{
            localUserId: string;
            provider: string;
            access_token: string;
            refresh_token: string;
            expires_at: NativeDate;
            scope: string[];
            provider_user_id?: string | null | undefined;
        }> & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        };
    };
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    scope: unknown[];
    localUserId?: unknown;
    provider?: unknown;
    access_token?: unknown;
    refresh_token?: unknown;
    expires_at?: {
        toJSON?: {} | null | undefined;
        [Symbol.toPrimitive]?: {} | null | undefined;
        toString?: {} | null | undefined;
        toLocaleString?: {} | null | undefined;
        toDateString?: {} | null | undefined;
        toTimeString?: {} | null | undefined;
        toLocaleDateString?: {} | null | undefined;
        toLocaleTimeString?: {} | null | undefined;
        getTime?: {} | null | undefined;
        getFullYear?: {} | null | undefined;
        getUTCFullYear?: {} | null | undefined;
        getMonth?: {} | null | undefined;
        getUTCMonth?: {} | null | undefined;
        getDate?: {} | null | undefined;
        getUTCDate?: {} | null | undefined;
        getDay?: {} | null | undefined;
        getUTCDay?: {} | null | undefined;
        getHours?: {} | null | undefined;
        getUTCHours?: {} | null | undefined;
        getMinutes?: {} | null | undefined;
        getUTCMinutes?: {} | null | undefined;
        getSeconds?: {} | null | undefined;
        getUTCSeconds?: {} | null | undefined;
        getMilliseconds?: {} | null | undefined;
        getUTCMilliseconds?: {} | null | undefined;
        getTimezoneOffset?: {} | null | undefined;
        setTime?: {} | null | undefined;
        setMilliseconds?: {} | null | undefined;
        setUTCMilliseconds?: {} | null | undefined;
        setSeconds?: {} | null | undefined;
        setUTCSeconds?: {} | null | undefined;
        setMinutes?: {} | null | undefined;
        setUTCMinutes?: {} | null | undefined;
        setHours?: {} | null | undefined;
        setUTCHours?: {} | null | undefined;
        setDate?: {} | null | undefined;
        setUTCDate?: {} | null | undefined;
        setMonth?: {} | null | undefined;
        setUTCMonth?: {} | null | undefined;
        setFullYear?: {} | null | undefined;
        setUTCFullYear?: {} | null | undefined;
        toUTCString?: {} | null | undefined;
        toISOString?: {} | null | undefined;
        getVarDate?: {} | null | undefined;
        valueOf?: {} | null | undefined;
    } | null | undefined;
    provider_user_id?: unknown;
} & {
    _id: mongoose.Types.ObjectId;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
    versionKey: false;
    toJSON: {
        transform: (_doc: mongoose.Document<unknown, {}, mongoose.FlatRecord<{
            localUserId: string;
            provider: string;
            access_token: string;
            refresh_token: string;
            expires_at: NativeDate;
            scope: string[];
            provider_user_id?: string | null | undefined;
        }>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
            localUserId: string;
            provider: string;
            access_token: string;
            refresh_token: string;
            expires_at: NativeDate;
            scope: string[];
            provider_user_id?: string | null | undefined;
        }> & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        }, ret: mongoose.FlatRecord<{
            localUserId: string;
            provider: string;
            access_token: string;
            refresh_token: string;
            expires_at: NativeDate;
            scope: string[];
            provider_user_id?: string | null | undefined;
        }> & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        }) => mongoose.FlatRecord<{
            localUserId: string;
            provider: string;
            access_token: string;
            refresh_token: string;
            expires_at: NativeDate;
            scope: string[];
            provider_user_id?: string | null | undefined;
        }> & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        };
    };
}, {
    localUserId: string;
    provider: string;
    access_token: string;
    refresh_token: string;
    expires_at: NativeDate;
    scope: string[];
    provider_user_id?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    localUserId: string;
    provider: string;
    access_token: string;
    refresh_token: string;
    expires_at: NativeDate;
    scope: string[];
    provider_user_id?: string | null | undefined;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    localUserId: string;
    provider: string;
    access_token: string;
    refresh_token: string;
    expires_at: NativeDate;
    scope: string[];
    provider_user_id?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
import mongoose from "mongoose";
//# sourceMappingURL=UserToken.d.ts.map