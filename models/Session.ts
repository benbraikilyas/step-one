import mongoose, { Schema, Document } from 'mongoose';

export interface IDecisionSession extends Document {
    sessionId: string;
    answers: string[];
    generatedDecision: string;
    committed: boolean;
    createdAt: Date;
}

const DecisionSessionSchema: Schema = new Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    answers: {
        type: [String],
        required: true,
    },
    generatedDecision: {
        type: String,
        required: true,
    },
    committed: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export default mongoose.models.DecisionSession || mongoose.model<IDecisionSession>('DecisionSession', DecisionSessionSchema);
