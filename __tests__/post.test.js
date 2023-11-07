import { beforeAll, describe, expect, test } from 'vitest';
import { faker } from '@faker-js/faker';
import { createJwtToken } from '@/utils/helpers';
import { filterUserPosts, generatePosts, generateUsers, sortPosts } from '@/tests/helpers';

describe('tests for api calls related to user posts', () => {
  let token, users, posts, user, userPosts, otherPosts;
  const NO_OF_POSTS = 25,
        NO_OF_USERS = 5;

  beforeAll(async () => {
    users = generateUsers(NO_OF_USERS);
    posts = generatePosts(users, NO_OF_POSTS);
    [user] = users;
    sortPosts(posts);
    [userPosts, otherPosts] = filterUserPosts(user, posts);
    token = await createJwtToken(user.id);

    await db.resetDb({ users, posts });
    await db.initDb({ users, posts });
  });

  /************************************************************/

  describe('query [post]', () => {
    test('error if no post with the given id exists', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.GET_POST, variables: { id: faker.database.mongodbObjectId() } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"No post with given id exists."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"NOT_FOUND"');
    });

    test('successfully queries the post with the given id', async () => {
      const [{ data }] = await client.execute(
        { query: query.GET_POST, variables: { id: posts[0].id } },
      );
      expect(data.post).toStrictEqual(posts[0]);
    });
  });

  /************************************************************/

  describe('query [postFeed]', () => {
    const noOfPosts1 = 10;
    const noOfPosts2 = 8;
    test('queries the first 10 posts', async () => {
      const [{ data }] = await client.execute(
        { query: query.GET_POSTFEED },
      );

      expect(data.postFeed.posts).toStrictEqual(posts.slice(0, noOfPosts1));
      expect(data.postFeed.hasNextPage).toBeTruthy();
      expect(data.postFeed.cursor).toBe(posts[noOfPosts1 - 1].id);
      expect(data.postFeed.results).toBe(noOfPosts1);
    });

    test('queries the next 8 posts from the given cursor', async () => {
      const [{ data }] = await client.execute(
        { query: query.GET_POSTFEED, variables: { cursor: posts[noOfPosts1 - 1].id, limit: noOfPosts2 } },
      );

      expect(data.postFeed.posts).toStrictEqual(posts.slice(noOfPosts1, noOfPosts1 + noOfPosts2));
      expect(data.postFeed.hasNextPage).toBeTruthy();
      expect(data.postFeed.cursor).toBe(posts[(noOfPosts1 + noOfPosts2) - 1].id);
      expect(data.postFeed.results).toBe(noOfPosts2);
    });

    test('queries the end of feed', async () => {
      const [{ data }] = await client.execute(
        { query: query.GET_POSTFEED, variables: { cursor: posts[(noOfPosts1 + noOfPosts2) - 1].id, limit: 100 } },
      );

      expect(data.postFeed.posts).toStrictEqual(posts.slice(noOfPosts1 + noOfPosts2));
      expect(data.postFeed.hasNextPage).toBeFalsy();
      expect(data.postFeed.cursor).toBeNull();
      expect(data.postFeed.results).toBe(posts.length - (noOfPosts1 + noOfPosts2));
    });
  });

  /************************************************************/

  describe('query [myPosts]', () => {
    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute({ query: query.GET_MY_POSTS });

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to access your posts."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('return user\'s posts', async () => {
      const [{ data }] = await client.execute({ query: query.GET_MY_POSTS }, token);

      expect(data.myPosts).toStrictEqual(userPosts);
    });
  });

  /************************************************************/

  describe('query [myLikedPosts]', () => {
    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute({ query: query.GET_MY_LIKED_POSTS });

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to access your liked posts."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('return user\'s liked posts', async () => {
      const [{ data }] = await client.execute({ query: query.GET_MY_LIKED_POSTS }, token);

      expect(data.myLikedPosts).toStrictEqual(posts.filter((post) => user.likedPosts.includes(post.id)));
    });
  });

  /************************************************************/

  describe('mutation [createPost]', () => {
    const content = 'A post with some content';

    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.CREATE_POST, variables: { content } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to create a post."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('error if content is empty', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.CREATE_POST, variables: { content: '' } },
        token,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! A post must have some text."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('successfully creates a post', async () => {
      const [{ data }] = await client.execute(
        { query: query.CREATE_POST, variables: { content } },
        token,
      );

      expect(data.createPost).toStrictEqual({
        id: expect.any(String),
        content,
        author: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        },
        likesCount: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  /************************************************************/

  describe('mutation [updatePost]', () => {
    const content = 'A post with some content';

    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_POST, variables: { id: userPosts[0].id, content } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to update a post."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('error if post with given id does not exist', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_POST, variables: { id: faker.database.mongodbObjectId(), content } },
        token,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"No post with given id exists."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"NOT_FOUND"');
    });

    test('error if post does not belong to user', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_POST, variables: { id: otherPosts[0].id, content } },
        token,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You do not have permission to update this post."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"FORBIDDEN"');
    });

    test('error if content is empty', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.UPDATE_POST, variables: { id: userPosts[0].id, content: '' } },
        token,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"Error! A post must have some text."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"BAD_REQUEST"');
    });

    test('successfully updates a post', async () => {
      const [{ data }] = await client.execute(
        { query: query.UPDATE_POST, variables: { id: userPosts[0].id, content } },
        token,
      );

      expect(data.updatePost).toStrictEqual({
        ...userPosts[0],
        content,
        updatedAt: expect.any(String),
      });
    });
  });

  /************************************************************/

  describe('mutation [deletePost]', () => {
    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.DELETE_POST, variables: { id: userPosts[0].id } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to delete a post."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('error if post does not exist', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.DELETE_POST, variables: { id: faker.database.mongodbObjectId() } },
        token,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"No post with given id exists."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"NOT_FOUND"');
    });

    test('error if post does not belong to user', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.DELETE_POST, variables: { id: otherPosts[0].id } },
        token,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You do not have permission to delete this post."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"FORBIDDEN"');
    });

    test('successfully deletes a post', async () => {
      const [{ data }] = await client.execute(
        { query: query.DELETE_POST, variables: { id: userPosts[0].id } },
        token,
      );

      expect(data.deletePost).toBe(userPosts[0].id);

      // User fetches the delted post
      const [{ data: data1, errors }] = await client.execute(
        { query: query.GET_POST, variables: { id: userPosts[0].id } },
      );

      expect(data1).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"No post with given id exists."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"NOT_FOUND"');
    });
  });

  /************************************************************/

  describe('mutation [toggleLike]', () => {
    test('error if token does not exist or is invalid', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.TOGGLE_LIKE, variables: { id: userPosts[1].id } },
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"You need to be signed in to like a post."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"UNAUTHENTICATED"');
    });

    test('error if post does not exist', async () => {
      const [{ data, errors }] = await client.execute(
        { query: query.TOGGLE_LIKE, variables: { id: faker.database.mongodbObjectId() } },
        token,
      );

      expect(data).toBeNull();
      expect(errors[0].message).toMatchInlineSnapshot('"No post with given id exists."');
      expect(errors[0].extensions.code).toMatchInlineSnapshot('"NOT_FOUND"');
    });

    test('toggle like', async () => {
      // Like a post
      const [{ data: like }] = await client.execute(
        { query: query.TOGGLE_LIKE, variables: { id: userPosts[1].id } },
        token,
      );

      expect(like.toggleLike).toStrictEqual({
        likesCount: userPosts[1].likesCount + 1,
        liked: true,
      });

      const [{ data: likedPost }] = await client.execute(
        { query: query.GET_POST, variables: { id: userPosts[1].id } },
        token,
      );

      expect(likedPost.post).toStrictEqual({
        ...userPosts[1],
        likesCount: userPosts[1].likesCount + 1,
        updatedAt: expect.any(String),
      });

      const [{ data: likeUser }] = await client.execute(
        { query: query.GET_ME },
        token,
      );

      expect(likeUser.me).toStrictEqual({
        ...user,
        likedPosts: [...user.likedPosts, userPosts[1].id],
      });

      // Unlike a post
      const [{ data: unlike }] = await client.execute(
        { query: query.TOGGLE_LIKE, variables: { id: userPosts[1].id } },
        token,
      );

      expect(unlike.toggleLike).toStrictEqual({
        likesCount: Math.max(0, userPosts[1].likesCount - 1),
        liked: false,
      });

      const [{ data: unlikedPost }] = await client.execute(
        { query: query.GET_POST, variables: { id: userPosts[1].id } },
        token,
      );

      expect(unlikedPost.post).toStrictEqual({
        ...userPosts[1],
        likesCount: Math.max(0, userPosts[1].likesCount - 1),
        updatedAt: expect.any(String),
      });

      const [{ data: unlikeUser }] = await client.execute(
        { query: query.GET_ME },
        token,
      );

      expect(unlikeUser.me).toStrictEqual(user);
    });
  });
});
