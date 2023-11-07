import 'dotenv/config';
import { env, exit } from 'node:process';
import { createServer } from 'node:http';

import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer as drainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { User } from '@/models';
import { typeDefs, resolvers } from '@/graphql';
import { verifyJwtToken } from '@/utils/helpers';
import { handleUnauthenticatedError } from '@/utils/error-handlers';
import logger from '@/utils/logger';

export default class Server {
  static #app;
  static #apolloServer;

  static {
    const app = express();
    const httpServer = createServer(app);

    this.#app = app;
    this.#apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
      plugins: [
        drainHttpServer({ httpServer }),
        {
          serverWillStart: async () => {
            await Server.#connectDb();
            await Server.#startHttpServer(httpServer);

            return {
              serverWillStop: async () => {
                await Server.#disconnectDb();
              },
            };
          },
          requestDidStart: () => ({
            didResolveOperation: ({ operationName, operation }) => {
              if (import.meta.env.DEV) logger.log(`${operation.operation} ${operationName}`);
            },
          }),
        },
      ],
    });
  }

  static async start() {
    try {
      await Server.#apolloServer.start();
      Server.#app.enable('trust-proxy');
      Server.#app.use(
        '/api',
        cors({ origin: env.CLIENT_URI, credentials: true }),
        express.json(),
        cookieParser(),
        expressMiddleware(Server.#apolloServer, { context: Server.#context }),
      );
    } catch (err) {
      if (import.meta.env.DEV) logger.error(err);
      logger.error('Trouble starting server. Exiting application...');
      exit(1);
    }
  }

  static async stop() {
    await Server.#apolloServer.stop();
  }

  static async #context({ req, res }) {
    const token = req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : req.cookies.jwt;

    if (!token) return { req, res };

    try {
      const payload = await verifyJwtToken(token);
      const user = await User.findById(payload.id).select('+password');

      if (!user) return { req, res };

      return { req, res, user };
    } catch (err) {
      if (req.cookies.jwt) return { req, res };
      return handleUnauthenticatedError('Invalid or expired token. Please login again');
    }
  }

  static async #startHttpServer(httpServer) {
    const port = env.PORT || 0;
    await new Promise((res) => { httpServer.listen({ port }, res); });

    logger.start(`http server started: http://localhost:${httpServer.address().port}/api`);
    httpServer.on('close', () => logger.success('http server closed'));
  }

  static async #connectDb() {
    if (import.meta.hot && mongoose.connection.readyState === 1) return;

    await mongoose.connect(env.DB_URI, { autoIndex: false });

    logger.start(`database connected: ${mongoose.connection.name}`);
    mongoose.connection.on('close', () => logger.success('database disconnected'));
  }

  static async #disconnectDb() {
    if (import.meta.hot && import.meta.hot.data.isReloading) return;
    await mongoose.connection.close();
  }
}

// For vite-node hmr
if (import.meta.hot) {
  import.meta.hot.data.isReloading = false;
  import.meta.hot.on('vite:beforeFullReload', () => {
    mongoose.deleteModel(/.+/);
    import.meta.hot.data.isReloading = true;
  });
}
