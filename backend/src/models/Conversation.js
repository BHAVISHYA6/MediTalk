import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageTime: {
      type: Date,
      default: new Date(),
    },
  },
  { timestamps: true }
);

// Index for efficient queries
conversationSchema.index({ participants: 1 });

export default mongoose.model('Conversation', conversationSchema);
