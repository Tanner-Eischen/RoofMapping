export const env = {
  databaseUrl: process.env.DATABASE_URL || '',
  skipDbCheck: (process.env.SKIP_DB_CHECK || 'false').toLowerCase() === 'true',
  redisUrl: process.env.REDIS_URL || '',
  sqsQueueUrl: process.env.SQS_QUEUE_URL || '',
};
