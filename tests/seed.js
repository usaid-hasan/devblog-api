import 'dotenv/config';
import { env, exit } from 'node:process';
import consola from 'consola';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { Post, User } from '@/models';

async function init() {
  await mongoose.connect(env.DB_URI);
  await resetDb();
  await seedDb();
  exit(0);
}

init();

async function resetDb() {
  await User.collection.drop();
  await Post.collection.drop();
  consola.success('Database reset');
}

async function seedDb() {
  const users = await User.create(generateUsers());
  await Post.create(generatePosts(users));
  consola.success('Database seeded');
}

function generateUsers(n = 10) {
  const users = [];

  for (let i = 0; i < n; i++) {
    users.push({
      username: `test_user${i + 1}`,
      email: `test_email${i + 1}@abc.com`,
      password: 'test1234',
    });
  }
  return users;
}

function generatePosts(users, n = 25) {
  const posts = [];

  for (let i = 0; i < n; i++) {
    const user = faker.helpers.arrayElement(users);
    posts.push({
      content: faker.lorem.paragraph(),
      author: new mongoose.Types.ObjectId(user.id),
    });
  }
  return posts;
}
