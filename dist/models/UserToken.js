import mongoose from "mongoose";
const UserTokenSchema = new mongoose.Schema({
    // Your app's user id (Clerk userId)
    localUserId: { type: String, required: true },
    // Provider lets you support multiple connections later if you want (e.g., "yahoo", "espn")
    provider: { type: String, required: true, default: "yahoo" },
    // OAuth tokens
    access_token: { type: String },
    refresh_token: { type: String },
    // Absolute time when the access token expires
    expires_at: { type: Date, required: true },
    // Optional metadata returned by Yahoo (store if you want)
    scope: { type: [String], default: [] },
    provider_user_id: { type: String }, // e.g., Yahoo guid if you fetch it
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: (_doc, ret) => {
            // never leak secrets if you ever return this doc
            delete ret.access_token;
            delete ret.refresh_token;
            return ret;
        },
    },
});
// One Yahoo connection per user
UserTokenSchema.index({ localUserId: 1, provider: 1 }, { unique: true });
// Convenience helper
UserTokenSchema.methods.isExpired = function (skewMs = 60000) {
    return Date.now() >= new Date(this.expires_at).getTime() - skewMs;
};
const UserToken = mongoose.model("UserToken", UserTokenSchema);
export default UserToken;
//# sourceMappingURL=UserToken.js.map