import { env } from 'node:process';
import { setTimeout } from 'node:timers/promises';
import { Post, User } from '@/models';
import Email from '@/utils/email';
import {
  passwordMatch,
  createJwtToken,
  createResetToken,
  setJwtCookieOnRes,
  unsetJwtCookieOnRes,
} from '@/utils/helpers';
import {
  handleBadRequestError,
  handleAuthFailedError,
  handleForbiddenError,
  handleNotFoundError,
  handleUnauthenticatedError,
} from '@/utils/error-handlers';

/************************************************************/

export async function signUp(_, { username, email, password, rememberme }, { res }) {
  const user = await User.createOne(username, email, password);
  if (!user) handleBadRequestError('Error creating user.');

  const token = await createJwtToken(user.id, rememberme);
  setJwtCookieOnRes(res, token, rememberme);

  return user;
}

/************************************************************/

export async function signIn(_, { username, email, password, rememberme }, { res }) {
  const user = await User.getOne(username, email);
  if (!user || !await passwordMatch(password, user.password)) handleAuthFailedError('Incorrect username or password.');

  const token = await createJwtToken(user.id, rememberme);
  setJwtCookieOnRes(res, token, rememberme);

  return user;
}

/************************************************************/

export function signOut(_, args, { res }) {
  unsetJwtCookieOnRes(res);
  return true;
}

/************************************************************/

export async function createPost(_, { content }, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to create a post.');

  return await Post.createOne(content, user.id);
}

/************************************************************/

export async function updatePost(_, { id, content }, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to update a post.');

  const post = await Post.getOneWithAuthor(id);
  if (!post) handleNotFoundError('No post with given id exists.');
  if (post.author.id !== user.id) handleForbiddenError('You do not have permission to update this post.');

  return await post.updatePost(content);
}

/************************************************************/

export async function deletePost(_, { id }, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to delete a post.');

  const post = await Post.getOne(id);
  if (!post) handleNotFoundError('No post with given id exists.');
  if (post.author.toString() !== user.id) handleForbiddenError('You do not have permission to delete this post.');

  await Post.deleteOne(id);
  await User.removeLikedPostFromAllUsers(id);

  return id;
}

/************************************************************/

export async function toggleLike(_, { id }, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to like a post.');

  const post = await Post.getOne(id);
  if (!post) handleNotFoundError('No post with given id exists.');

  let liked = user.likedPosts.indexOf(post.id) >= 0;
  let { likesCount } = post;

  if (liked) {
    await User.updateLikedPosts(user.id, post.id, false);
    liked = false;
    await Post.updateLikes(post.id, -1);
    likesCount -= 1;
  } else {
    await User.updateLikedPosts(user.id, post.id, true);
    liked = true;
    await Post.updateLikes(post.id, 1);
    likesCount += 1;
  }

  return { likesCount, liked };
}

/************************************************************/

export async function forgotPassword(_, { email }) {
  const msg = 'Your reset token is sent to email. Token is valid for only (10) minutes.';
  const user = await User.getOneByEmail(email);

  // For security purpose send fake response even if no user found
  if (!user || (user.passwordResetToken && user.passwordResetTokenExpiresAt > Date.now())) {
    return await setTimeout(Number(env.EMAIL_TIMEOUT), msg);
  }

  const resetToken = await createResetToken();

  try {
    const [{ messageId }] = await Promise.all([
      new Email(user).sendPasswordResetToken(resetToken),
      setTimeout(Number(env.EMAIL_TIMEOUT)),
    ]);
    if (!messageId) throw new Error();
  } catch {
    throw new Error('Problem sending the email! Try again later.');
  }

  await user.createPasswordResetToken(resetToken);

  return msg;
}

/************************************************************/

export async function resetPassword(_, { resetToken, password }, { res }) {
  const user = await User.getOneByToken(resetToken);
  if (!user) handleBadRequestError('Reset token is invalid or has expired.');

  await user.resetPassword(password);
  const token = await createJwtToken(user.id);
  setJwtCookieOnRes(res, token);

  return user;
}

/************************************************************/

export async function updateUser(_, { email }, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to update your email.');
  if (!email || email === user.email) handleBadRequestError('Please provide a new email to update.');

  return await user.updateUser(email);
}

/************************************************************/

export async function updatePassword(_, { currentPassword, newPassword }, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to update password.');
  if (!await passwordMatch(currentPassword, user.password)) handleAuthFailedError('Incorrect password.');

  return await user.updateUser(null, newPassword);
}

/************************************************************/

export async function deleteUser(_, { password }, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to delete your account.');
  if (!await passwordMatch(password, user.password)) handleAuthFailedError('Incorrect password.');

  await User.deleteOne(user.id);

  return user.id;
}
