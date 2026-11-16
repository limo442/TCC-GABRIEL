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

const app = express();
const PORT = process.env.NODE_PORT || 8002;

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'aluguel-carros-api' });
});

// Auth routes (login/logout - public, no auth required)
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Apply authentication middleware to all routes except health and auth
app.use(authenticate);

// Routes
app.use('/api/veiculos', veiculosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/alugueis', alugueisRouter);
app.use('/api/dashboard', dashboardRouter);

// 404
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    type: 'NOT_FOUND',
    message: 'Rota não encontrada',
    detailedMessage: `${req.method} ${req.originalUrl} não encontrado`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    type: 'INTERNAL_SERVER_ERROR',
    message: 'Erro interno do servidor',
    detailedMessage: err.message,
  });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Node.js] Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
