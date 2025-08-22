import { Schema, model } from "mongoose";
import validator from "validator";
const userSchema = new Schema({
    username: {
        type: String,
        required: false,
        unique: true,
    },
    clerkUserId: {
        type: String,
        required: false,
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (email) => validator.isEmail(email),
            message: (props) => `${props.value} is not a valid email address!`,
        },
    },
    friendRequestsSent: [
        { type: Schema.Types.ObjectId, ref: "User", default: [] },
    ],
    friendRequestsReceived: [
        { type: Schema.Types.ObjectId, ref: "User", default: [] },
    ],
    friends: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    password: {
        // ToDo Low Priority: going to remove this field
        type: String,
        required: false,
        validate: {
            validator: (password) => !password || password.length >= 8, //validator.isStrongPassword(password),
            message: (props) => `${props.value} is not a strong password!`,
        },
    },
    displayName: {
        // ToDo Low Priority: going to remove this field
        type: String,
        required: false,
    },
    roles: {
        type: [String],
        enum: ["admin", "user", "superadmin", "moderator", "guest"],
        default: ["user"],
    },
    mostRecentLeague: {
        // ToDo Low Priority: going to remove this field
        type: Schema.Types.ObjectId,
        ref: "League",
        default: null,
    },
    passwordResetToken: String, // ToDo Low Priority: going to remove this field
    passwordResetExpires: Date, // ToDo Low Priority: going to remove this field
}, {
    timestamps: true,
});
export default model("User", userSchema);
//# sourceMappingURL=user.model.js.map