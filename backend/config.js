const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || Buffer.byteLength(jwtSecret, 'utf8') < 32 || /substitua|coloque|change.in.production|your.secret/i.test(jwtSecret)) {
  throw new Error('JWT_SECRET é obrigatório e deve ter pelo menos 32 bytes. Configure backend/.env.');
}

module.exports = {
  jwtSecret,
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001')
    .split(',').map(origin => origin.trim()).filter(Boolean)
};
