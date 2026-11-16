const express = require('express');
const router = express.Router();

// Consulta a uma fonte oficial de dados públicos (IBGE).
// Nunca envia informações de clientes ao serviço externo.
router.get('/ufs', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
      response = await fetch(process.env.IBGE_API_URL || 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome', {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return res.status(502).json({
      code: 'EXTERNAL_API', message: 'Serviço de localidades indisponível'
    });
    const result = await response.json();
    res.json({
      origem: 'IBGE — API de Localidades',
      items: result.map(({ id, sigla, nome }) => ({ id, sigla, nome }))
    });
  } catch (_) {
    res.status(502).json({ code: 'EXTERNAL_API', message: 'Não foi possível consultar o IBGE' });
  }
});

module.exports = router;
