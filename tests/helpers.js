/* eslint-disable no-param-reassign */
import { faker } from '@faker-js/faker';

/************************************************************/

export function generatePosts(authors, n = 1) {
  const posts = [];
  const uniqueIds = faker.helpers.uniqueArray(faker.database.mongodbObjectId, n);

  const weightedAuthors = authors.map((author) => ({ weight: 1, value: author }));
  weightedAuthors[0].weight = 2;

  for (let i = 0; i < n; i++) {
    const author = faker.helpers.weightedArrayElement(weightedAuthors);
    const date = faker.date.recent();
    posts.push({
      id: uniqueIds[i],
      likesCount: 0,
      content: faker.lorem.paragraph(),
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      author: {
        id: author.id,
        username: author.username,
        avatar: author.avatar,
      },
    });
  }

  return posts;
}

/************************************************************/

export function generateUsers(n = 1) {
  const users = [];
  const uniqueIds = faker.helpers.uniqueArray(faker.database.mongodbObjectId, n);

  for (let i = 0; i < n; i++) {
    users.push({
      id: uniqueIds[i],
      username: `test_user${i + 1}`,
      email: `test_email${i + 1}@abc.com`,
      avatar: faker.string.hexadecimal({ length: 32, casing: 'upper', prefix: '' }),
      likedPosts: [],
    });
  }

  return users;
}

/************************************************************/

export function createLikedPosts(user, posts, n = 3) {
  const likedPosts = faker.helpers.arrayElements(posts, n);
  user.likedPosts = likedPosts.map((post) => {
    post.likesCount += 1;
    return post.id;
  });
}

/************************************************************/

export function sortPosts(posts) {
  posts.sort((a, b) => {
    if (a.id > b.id) return -1;
    if (a.id < b.id) return 1;
    return 0;
  });
}

/************************************************************/

export function filterUserPosts(user, posts) {
  const userPosts = [],
        otherPosts = [];

  posts.forEach((post) => (post.author.id === user.id ? userPosts.push(post) : otherPosts.push(post)));

  return [userPosts, otherPosts];
}
