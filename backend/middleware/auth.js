const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

// Somente JWT de funcionário tem acesso às rotas administrativas.
// O perfil é buscado no banco em cada requisição, evitando privilégios antigos.
async function authenticate(req, res, next) {
  const header = req.header('Authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token JWT obrigatório' });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ['HS256'] });
    if (decoded.type !== 'user' || !decoded.sub || !decoded.jti) throw new Error('Token sem identificação válida');
  } catch (_) {
    return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' });
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.role,
        EXISTS(SELECT 1 FROM iam.tokens_revogados t
               WHERE t.jti = $2 AND t.expires_at > NOW()) AS revoked
         FROM iam.usuarios u WHERE u.id = $1`,
      [decoded.sub, decoded.jti]
    );
    if (!result.rows.length || result.rows[0].revoked) {
      return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Token revogado ou usuário inexistente' });
    }
    const { id, username, role } = result.rows[0];
    req.user = { id, username, role };
    req.tokenJti = decoded.jti;
    req.tokenExp = decoded.exp;
    next();
  } catch (err) {
    console.error('Falha ao autenticar requisição:', err);
    res.status(500).json({ code: 'AUTH_ERROR', message: 'Erro ao verificar autenticação' });
  }
}

module.exports = authenticate;
