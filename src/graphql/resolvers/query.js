import { Post } from '@/models';
import { handleNotFoundError, handleUnauthenticatedError } from '@/utils/error-handlers';

/************************************************************/

export async function post(_, { id }) {
  const singlePost = await Post.getOneWithAuthor(id);
  if (!singlePost) handleNotFoundError('No post with given id exists.');

  return singlePost;
}

/************************************************************/

export async function postFeed(_, { cursor, limit = 10 }) {
  let posts = await Post.getFeed(cursor, limit);

  let hasNextPage = false;

  if (posts.length > limit) {
    hasNextPage = true;
    posts = posts.slice(0, -1);
  }

  const results = posts.length;
  const newCursor = (results === 0 || !hasNextPage) ? null : posts[results - 1].id;

  return {
    results,
    posts,
    hasNextPage,
    cursor: newCursor,
  };
}

/************************************************************/

export function me(_, args, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to access your profile.');

  return user;
}

/************************************************************/

export async function myPosts(_, args, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to access your posts.');

  return await Post.getAllByAuthor(user.id);
}

/************************************************************/

export async function myLikedPosts(_, args, { user }) {
  if (!user) handleUnauthenticatedError('You need to be signed in to access your liked posts.');

  return await Post.getUserLikedPosts(user.likedPosts);
}
