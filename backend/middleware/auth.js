const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware to authenticate requests using either API Key or JWT
 * API Key: For client portal (sent as X-API-Key header)
 * JWT: For user portal (sent as Authorization: Bearer <token> header)
 */
const authenticate = (req, res, next) => {
  // Check for API Key (client portal)
  const apiKey = req.header(config.apiKeyHeader);
  if (apiKey && config.validApiKeys.includes(apiKey)) {
    // API Key authentication successful
    req.authType = 'api-key';
    req.user = { type: 'client' };
    return next();
  }

  // Check for JWT (user portal)
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      // JWT authentication successful
      req.authType = 'jwt';
      req.user = {
        id: decoded.id,
        username: decoded.username,
        type: 'user'
      };
      return next();
    } catch (err) {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        type: 'UNAUTHORIZED',
        message: 'Token inválido ou expirado',
        detailedMessage: err.message
      });
    }
  }

  // No valid authentication provided
  return res.status(401).json({
    code: 'UNAUTHORIZED',
    type: 'UNAUTHORIZED',
    message: 'Não autorizado',
    detailedMessage: 'É necessário fornecer API Key ou token JWT válido'
  });
};

module.exports = authenticate;