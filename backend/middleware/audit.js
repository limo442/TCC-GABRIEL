const db = require('../db');

// Registra operações relevantes sem copiar bodies, senhas, JWTs, emails ou IP.
module.exports = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  res.once('finish', () => {
    const route = (req.baseUrl || '') + (req.route?.path || req.path || '');
    if (route.length > 90) return;
    // Não reter o identificador do titular: apenas método e rota padronizada.
    const safeRoute = route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
      .replace(/\/\d+(?=\/|$)/g, '/:id').slice(0, 90);
    db.query(
      'INSERT INTO iam.auditoria(usuario_id, evento, recurso, codigo_http) VALUES ($1,$2,$3,$4)',
      [req.user?.id || null, req.method, safeRoute, res.statusCode]
    ).catch(() => {
      // Não interrompe respostas por falha isolada no log.
      console.error('Falha ao persistir evento de auditoria');
    });
  });
  next();
};
