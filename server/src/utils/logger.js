const logger = {
  info: (msg) => console.log(`\x1b[32m[INFO]\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  debug: (msg) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\x1b[34m[DEBUG]\x1b[0m ${msg}`);
    }
  }
};

module.exports = logger;
