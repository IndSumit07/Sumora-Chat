import mongoose from 'mongoose';
import { MEMBER_ROLES } from '../utils/constants.js';

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(MEMBER_ROLES),
      default: MEMBER_ROLES.MEMBER,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const groupSettingsSchema = new mongoose.Schema(
  {
    isPublic: { type: Boolean, default: false },
    allowMembersToAddOthers: { type: Boolean, default: true },
    allowMembersToEditInfo: { type: Boolean, default: false },
    onlyAdminsCanMessage: { type: Boolean, default: false },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarKey: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    settings: {
      type: groupSettingsSchema,
      default: () => ({}),
    },
    inviteLink: {
      type: String,
      unique: true,
      sparse: true,
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupMessage',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMessage',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ lastMessageAt: -1 });
groupSchema.index({ inviteLink: 1 }, { unique: true, sparse: true });
groupSchema.index({ createdBy: 1 });

// Instance methods
groupSchema.methods.isAdmin = function (userId) {
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member?.role === MEMBER_ROLES.ADMIN;
};

groupSchema.methods.isCoAdmin = function (userId) {
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member?.role === MEMBER_ROLES.CO_ADMIN;
};

groupSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

groupSchema.methods.isAdminOrCoAdmin = function (userId) {
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member?.role === MEMBER_ROLES.ADMIN || member?.role === MEMBER_ROLES.CO_ADMIN;
};

groupSchema.methods.getMember = function (userId) {
  return this.members.find((m) => m.user.toString() === userId.toString());
};

groupSchema.methods.getMemberIds = function () {
  return this.members.map((m) => m.user.toString());
};

const Group = mongoose.model('Group', groupSchema);
export default Group;
