/* eslint-disable no-invalid-this */
import mongoose from 'mongoose';
import { handleCastError, handleValidationError } from '@/utils/error-handlers';

const postSchema = new mongoose.Schema({
  content: {
    type: 'String',
    trim: true,
    required: [true, 'A post must have some text'],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    immutable: true,
    required: [true, 'A post must belong to a user'],
  },
  likesCount: {
    type: 'Number',
    default: 0,
    min: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
}, {
  timestamps: true,
  statics: {
    async getOne(id) {
      return await this.findById(id).exec();
    },
    async getOneWithAuthor(id) {
      return await this.findById(id).populate('author').exec();
    },
    async getAllByAuthor(author) {
      return await this.find({ author }).sort({ _id: -1 }).populate('author').exec();
    },
    async getUserLikedPosts(likedPosts) {
      return await this.find({ _id: { $in: likedPosts } }).sort({ _id: -1 }).populate('author').exec();
    },
    async getFeed(cursor, limit) {
      const cursorQuery = cursor ? { _id: { $lt: cursor } } : {};
      return await this.find(cursorQuery).sort({ _id: -1 }).limit(limit + 1).populate('author').exec();
    },
    async createOne(content, author) {
      return await (await this.create({ content, author })).populate('author');
    },
    async deleteOne(id) {
      return await this.findByIdAndUpdate(id, { isDeleted: true }).exec();
    },
    async updateLikes(id, inc) {
      return await this.findByIdAndUpdate(id, { $inc: { likesCount: inc } }, { new: true }).exec();
    },
  },
  methods: {
    async updatePost(content) {
      this.content = content;
      return await this.save();
    },
  },
});

postSchema.pre(/^find/, function excludeDeletedPosts(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

postSchema.post(/save|find/, function errorHandler(err, post, next) {
  if (err.name === 'ValidationError') handleValidationError(err);
  if (err.name === 'CastError') handleCastError(err);
  next();
});

export default mongoose.models.Post ?? mongoose.model('Post', postSchema);
