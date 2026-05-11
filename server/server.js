import app from './src/app.js';
import logger from './src/config/logger.js';
import { PORT } from './src/config/env.js';
import { initCronJobs } from './src/services/cronService.js';

app.listen(PORT, () => {
  logger.info(`KindHeart Server running on http://localhost:${PORT}`);

  // Intialise cron jobs
  initCronJobs
});
