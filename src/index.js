import { env, version } from 'node:process';
import Server from '@/server';
import logger from '@/utils/logger';

if (!import.meta.hot?.data.isReloading) {
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Node version: ${version}`);
}

await Server.start();

// For vite-node hmr
if (import.meta.hot) {
  import.meta.hot.data.isReloading = false;

  import.meta.hot.on('vite:beforeFullReload', async () => {
    import.meta.hot.data.isReloading = true;
    logger.box('HMR full reload');
    await Server.stop();
  });
}
