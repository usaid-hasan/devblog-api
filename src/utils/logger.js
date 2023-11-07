import { createConsola } from 'consola';
// eslint-disable-next-line import/no-unresolved
import { colorize } from 'consola/utils';

export default new class Logger {
  constructor() {
    const WARNING = 1,
          DEFAULT = 3;

    this.logger = createConsola({
      level: import.meta.env.TEST ? WARNING : DEFAULT,
      fancy: import.meta.env.DEV,
      formatOptions: {
        colors: import.meta.env.DEV,
        columns: 70,
      },
    });
  }

  static #colored(message, color) {
    return import.meta.env.DEV ? colorize(color ?? 'gray', message) : message;
  }

  log(message) {
    this.logger.log(message);
  }

  error(err) {
    if (err instanceof Error) this.logger.error(err);
    else this.logger.error(Logger.#colored(err, 'red'));
  }

  info(message) {
    this.logger.info(Logger.#colored(message));
  }

  start(message) {
    this.logger.start(Logger.#colored(message));
  }

  success(message) {
    this.logger.success(Logger.#colored(message));
  }

  box(message) {
    this.logger.box({
      message,
      style: { padding: 0, marginTop: 0, marginBottom: 0, borderColor: 'gray' },
    });
  }
}();
