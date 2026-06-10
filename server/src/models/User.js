import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const notificationPreferencesSchema = new mongoose.Schema(
  {
    messages: { type: Boolean, default: true },
    friendRequests: { type: Boolean, default: true },
    groups: { type: Boolean, default: true },
  },
  { _id: false }
);

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [50, 'Full name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    hasPassword: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
      default: '',
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isGoogleAuth: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({}),
    },
    pushSubscription: {
      type: pushSubscriptionSchema,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// Explicit indexes for fields without unique/sparse in definition
userSchema.index({ isDeleted: 1 });
userSchema.index({ friends: 1 });

// Pre-save hook: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.hasPassword = true;
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: return safe object (strips sensitive fields)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.pushSubscription;
  delete obj.__v;
  return obj;
};

// Static method: find by email or username
userSchema.statics.findByEmailOrUsername = function (identifier) {
  const lower = identifier.toLowerCase().trim();
  return this.findOne({
    $or: [{ email: lower }, { username: lower }],
    isDeleted: { $ne: true },
  }).select('+password');
};

const User = mongoose.model('User', userSchema);
export default User;
