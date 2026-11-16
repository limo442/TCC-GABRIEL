require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const authenticate = require('./middleware/auth');

const veiculosRouter = require('./routes/veiculos');
const usuariosRouter = require('./routes/usuarios');
const clientesRouter = require('./routes/clientes');
const alugueisRouter = require('./routes/alugueis');
const dashboardRouter = require('./routes/dashboard');
const publicoRouter = require('./routes/publico');
const solicitacoesRouter = require('./routes/solicitacoes');
const integracoesRouter = require('./routes/integracoes');
const auditoriaRouter = require('./routes/auditoria');
const audit = require('./middleware/audit');

const app = express();
const PORT = process.env.NODE_PORT || 8002;

app.use(cors({ origin: config.corsOrigins }));
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(audit);

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'aluguel-carros-api' });
});

// Auth routes (login/logout - public, no auth required)
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// RF12: consulta e solicitação públicas, sem acesso a informações administrativas.
app.use('/api/publico', publicoRouter);

// Todas as operações administrativas passam por JWT.
 // Apply authentication middleware to all routes except health, auth and public
app.use(authenticate);

// Routes
app.use('/api/veiculos', veiculosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/alugueis', alugueisRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/solicitacoes', solicitacoesRouter);
app.use('/api/integracoes', integracoesRouter);
app.use('/api/auditoria', auditoriaRouter);

// 404
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    type: 'NOT_FOUND',
    message: 'Rota não encontrada',
    detailedMessage: 'Verifique o endereço solicitado',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    type: 'INTERNAL_SERVER_ERROR',
    message: 'Erro interno do servidor',
    detailedMessage: 'Consulte o administrador do sistema',
  });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Node.js] Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
