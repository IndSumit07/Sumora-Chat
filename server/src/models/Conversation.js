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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    // Map: userId (string) -> unread count
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: participants sorted to prevent duplicate DMs
// We ensure participants array is always sorted before saving
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Pre-save: sort participants to ensure consistent ordering
conversationSchema.pre('save', function (next) {
  if (this.isNew && this.participants.length === 2) {
    this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
  }
  next();
});

// Static: find or create DM conversation
conversationSchema.statics.findOrCreateDM = async function (userId1, userId2) {
  const sorted = [userId1.toString(), userId2.toString()].sort();

  let conversation = await this.findOne({
    participants: { $all: sorted, $size: 2 },
  });

  if (!conversation) {
    conversation = await this.create({
      participants: sorted,
      unreadCount: new Map(),
    });
  }

  return conversation;
};

// Instance method: get other participant
conversationSchema.methods.getOtherParticipant = function (userId) {
  return this.participants.find((p) => p.toString() !== userId.toString());
};

// Instance method: increment unread count for a user
conversationSchema.methods.incrementUnread = function (userId) {
  const key = userId.toString();
  const current = this.unreadCount.get(key) || 0;
  this.unreadCount.set(key, current + 1);
};

// Instance method: reset unread count for a user
conversationSchema.methods.resetUnread = function (userId) {
  this.unreadCount.set(userId.toString(), 0);
};

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
