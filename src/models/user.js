/* eslint-disable no-invalid-this, no-undefined, no-magic-numbers */
import ms from 'ms';
import mongoose from 'mongoose';
import validator from 'validator';
import { avatarHash, passwordHash, resetTokenHash } from '@/utils/helpers';
import { handleCastError, handleMongoServerError, handleValidationError } from '@/utils/error-handlers';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    trim: true,
    minlength: [3, 'Please provide a username with atleast 3 characters'],
    maxlength: [20, 'Please provide a username with less than 20 characters'],
    required: [true, 'Please provide a username'],
    match: [/^(?![_])(?!.*[_]{2})\w+(?<![_])$/, 'Only letters, numbers & underscores allowed with no consecutive underscores at start or end'],
    get(username) { return this.isDeleted ? '[deleted]' : username; },
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    required: [true, 'Please provide a valid email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email',
    },
  },
  avatar: String,
  password: {
    type: String,
    select: false,
    minlength: [8, 'Password must be atleast 8 characters long'],
    required: [true, 'Please provide a password'],
  },
  likedPosts: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  }],
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetTokenExpiresAt: {
    type: Number,
    select: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  statics: {
    async getOne(username, email) {
      return await this.findOne({ $or: [{ email }, { username }] }).select('+password').exec();
    },
    async getOneByEmail(email) {
      return await this.findOne({ email }).select('+passwordResetToken +passwordResetTokenExpiresAt +password').exec();
    },
    async createOne(username, email, password) {
      return await this.create({ username, email, password });
    },
    async deleteOne(id) {
      return await this.findByIdAndUpdate(id, { isDeleted: true }).exec();
    },
    async getOneByToken(resetToken) {
      return await this.findOne({
        passwordResetToken: resetTokenHash(resetToken),
        passwordResetTokenExpiresAt: { $gt: Date.now() },
      }).exec();
    },
    async updateLikedPosts(id, post, push) {
      if (push) return await this.findByIdAndUpdate(id, { $push: { likedPosts: post } }).exec();
      return await this.findByIdAndUpdate(id, { $pull: { likedPosts: post } }).exec();
    },
    async removeLikedPostFromAllUsers(id) {
      await this.updateMany({ likedPosts: { $elemMatch: { $eq: id } } }, { $pull: { likedPosts: id } }).exec();
    },
  },
  methods: {
    async updateUser(email, password) {
      this.email = email ?? this.email;
      this.password = password ?? this.password;

      return await this.save();
    },
    async getUserLikedPosts() {
      return await this.populate({ path: 'likedPosts', populate: { path: 'author' } });
    },
    async createPasswordResetToken(resetToken) {
      this.passwordResetToken = resetTokenHash(resetToken);
      this.passwordResetTokenExpiresAt = Date.now() + ms('10m');

      return await this.save({ validateBeforeSave: false });
    },
    async resetPassword(password) {
      this.password = password ?? this.password;
      this.passwordResetToken = undefined;
      this.passwordResetTokenExpiresAt = undefined;

      return await this.save();
    },
  },
});

userSchema.pre('findOne', function excludeDeletedUsers(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('save', async function convertPasswordToHash(next) {
  if (!this.isModified('password')) return next();
  this.password = await passwordHash(this.password);
  return next();
});

userSchema.pre('save', function generateAvatar(next) {
  if (!this.isModified('email')) return next();
  this.avatar = avatarHash(this.email);
  return next();
});

userSchema.post(/save|find/, function errorHandler(err, user, next) {
  if (err.name === 'MongoServerError') handleMongoServerError(err);
  if (err.name === 'ValidationError') handleValidationError(err);
  if (err.name === 'CastError') handleCastError(err);
  next();
});

export default mongoose.models.User ?? mongoose.model('User', userSchema);
