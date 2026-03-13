import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema(
    {
        callerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endTime: {
            type: Date,
            required: false, // Updated when call ends
        },
        duration: {
            type: Number, // Stored in seconds
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

const CallLog = mongoose.model('CallLog', callLogSchema);
export default CallLog;
