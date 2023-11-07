import { faker } from '@faker-js/faker';

export default class DbClient {
  constructor(db) {
    this.db = db;
    this.userCol = this.db.collection('users');
    this.postCol = this.db.collection('posts');
  }

  async initDb({ users, posts }) {
    if (users) {
      await this.userCol.createIndex({ email: 1 }, { unique: true });
      await this.userCol.createIndex({ username: 1 }, { unique: true });
      if (users.length === 1) await this.userCol.insertOne(DbClient.#getUserDoc(users[0]));
      else await this.userCol.insertMany(users.map((user) => DbClient.#getUserDoc(user)));
    }

    if (posts) {
      if (posts.length === 1) await this.postCol.insertOne(DbClient.#getPostDoc(posts[0]));
      else await this.postCol.insertMany(posts.map((post) => DbClient.#getPostDoc(post)));
    }
  }

  async resetDb({ users, posts }) {
    if (users) await this.userCol.drop().catch(() => { });
    if (posts) await this.postCol.drop().catch(() => { });
  }

  async updateDb(doc, col, op, update) {
    return await this.db.collection(col).updateOne(
      { _id: new ObjectId(doc.id) },
      { [op]: update },
    );
  }

  static #getPostDoc(post) {
    return {
      _id: new ObjectId(post.id),
      author: new ObjectId(post.author.id),
      likesCount: post.likesCount,
      content: post.content,
      isDeleted: false,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
    };
  }

  static #getUserDoc(user) {
    const date = faker.date.past();
    // Bcrypt hash of 'test1234'
    const password = '$2b$10$KJWyPtCjej5Vb0sPSqLMMOUBIz0edQapRiN2hsPB33ZKT7Mv.dQ8S';
    return {
      _id: new ObjectId(user.id),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      password,
      likedPosts: user.likedPosts.map((id) => new ObjectId(id)),
      createdAt: date,
      updatedAt: date,
      isDeleted: false,
    };
  }
}
