import { env } from 'node:process';
import { format } from 'node:url';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { typeDefs, resolvers } from '@/graphql';
import DbClient from './db-client';
import HttpClient from './http-client';
import * as query from './test-queries';

if (!globalThis.db) {
  await mongoose.connect(env.DB_URI, { autoIndex: true });
  globalThis.ObjectId = mongoose.Types.ObjectId;
  globalThis.db = new DbClient(mongoose.connection.getClient().db('test'));
  globalThis.client = new HttpClient(format({ protocol: 'http', hostname: 'localhost', port: env.PORT, pathname: '/api' }));
  globalThis.server = new ApolloServer({ typeDefs, resolvers });
  globalThis.query = query;
}
