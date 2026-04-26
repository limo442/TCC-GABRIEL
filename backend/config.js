// Configuration for database schemas and other settings
module.exports = {
  schemas: {
    iam: process.env.DB_SCHEMA_IAM || 'iam',
    aluguel: process.env.DB_SCHEMA_ALUGUEL || 'aluguel'
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  apiKeyHeader: process.env.API_KEY_HEADER || 'X-API-Key',
  validApiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : ['dev-api-key-change-in-production']
};