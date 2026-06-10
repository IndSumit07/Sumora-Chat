import mongoose from 'mongoose';
import { encryptText, decryptText } from '../utils/helpers.js';
import { MESSAGE_TYPES } from '../utils/constants.js';

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 10,
    },
  },
  { _id: false }
);

const readBySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means deleted/anonymized
    },
    // Stored encrypted as "iv:ciphertext" in DB
    content: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(MESSAGE_TYPES),
      default: MESSAGE_TYPES.TEXT,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileKey: {
      type: String, // S3 key for deletion
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    thumbnailKey: {
      type: String,
      default: null,
    },
    duration: {
      type: Number, // seconds (for audio/video)
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [reactionSchema],
    readBy: [readBySchema],
    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient message pagination
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, _id: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ replyTo: 1 });

// Pre-save: encrypt content before storing
messageSchema.pre('save', function (next) {
  if (this.isModified('content') && this.content && !this.isDeleted) {
    try {
      this.content = encryptText(this.content);
    } catch {
      // If encryption fails (e.g., missing key in dev), store as-is
    }
  }
  next();
});

// Instance method: decrypt and return content
messageSchema.methods.getDecryptedContent = function () {
  if (!this.content) return null;
  if (this.isDeleted) return '[This message was deleted]';
  return decryptText(this.content);
};

// Virtual: decrypted content for JSON serialization
messageSchema.set('toJSON', {
  transform: function (doc, ret) {
    if (ret.content && !ret.isDeleted) {
      ret.content = decryptText(ret.content);
    } else if (ret.isDeleted) {
      ret.content = '[This message was deleted]';
    }
    return ret;
  },
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
