import mongoose from "mongoose";

// Define MongoDB user data fields
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    verified: Boolean,
    verificationToken: String,
    apiKeys: [{
        name: String,
        key: { type: String, unique: true },
        useCount: { type: Number, default: 0 }
    }]
});
const User = mongoose.model('User', userSchema);

export default User;