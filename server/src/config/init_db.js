const logger = require('../utils/logger');

const initializeDatabase = async () => {
  try {
    // Current iris-os-fresh database initialization just requires the file
    require('./database');
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Database initialization failed: ' + err.message);
    throw err;
  }
};

module.exports = initializeDatabase;
