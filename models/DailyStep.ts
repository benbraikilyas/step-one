import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyStep extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // "YYYY-MM-DD" in UTC
    content: string;
    sessionId: string;
    dayNumber: number; // 1-7 (consecutive day in program)
    questions: string[]; // AI-generated questions for this day
    answers: string[]; // User's responses
    completed: boolean; // Session finished
    createdAt: Date;
}

const DailyStepSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    dayNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    questions: {
        type: [String],
        required: true
    },
    answers: {
        type: [String],
        required: true
    },
    completed: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound unique index: prevents duplicates + enables fast queries
DailyStepSchema.index({ userId: 1, date: 1 }, { unique: true });

// Optional: TTL cleanup after 90 days (7776000 seconds)
DailyStepSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.models.DailyStep || mongoose.model<IDailyStep>('DailyStep', DailyStepSchema);
