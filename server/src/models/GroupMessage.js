import mongoose from 'mongoose';
import { encryptText, decryptText } from '../utils/helpers.js';
import { MESSAGE_TYPES } from '../utils/constants.js';

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true, maxlength: 10 },
  },
  { _id: false }
);

const readBySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const groupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    content: { type: String, default: null },
    type: {
      type: String,
      enum: Object.values(MESSAGE_TYPES),
      default: MESSAGE_TYPES.TEXT,
    },
    fileUrl: { type: String, default: null },
    fileKey: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: null },
    mimeType: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    thumbnailKey: { type: String, default: null },
    duration: { type: Number, default: null },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMessage',
      default: null,
    },
    reactions: [reactionSchema],
    readBy: [readBySchema],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

groupMessageSchema.index({ groupId: 1, createdAt: -1 });
groupMessageSchema.index({ groupId: 1, _id: -1 });

groupMessageSchema.pre('save', function (next) {
  if (this.isModified('content') && this.content && !this.isDeleted) {
    try {
      this.content = encryptText(this.content);
    } catch {}
  }
  next();
});

groupMessageSchema.set('toJSON', {
  transform: function (doc, ret) {
    if (ret.content && !ret.isDeleted) {
      ret.content = decryptText(ret.content);
    } else if (ret.isDeleted) {
      ret.content = '[This message was deleted]';
    }
    return ret;
  },
});

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
export default GroupMessage;
