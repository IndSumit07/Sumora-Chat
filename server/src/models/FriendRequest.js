import mongoose from 'mongoose';
import { FRIEND_REQUEST_STATUSES } from '../utils/constants.js';

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(FRIEND_REQUEST_STATUSES),
      default: FRIEND_REQUEST_STATUSES.PENDING,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    message: {
      type: String,
      maxlength: [200, 'Request message cannot exceed 200 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate requests
friendRequestSchema.index(
  { sender: 1, receiver: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: FRIEND_REQUEST_STATUSES.PENDING,
    },
  }
);
friendRequestSchema.index({ receiver: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
export default FriendRequest;
