// Execute apenas uma vez para criar o primeiro administrador.
// Ex.: ADMIN_USERNAME=admin ADMIN_PASSWORD="senha forte" node scripts/create-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Defina ADMIN_PASSWORD com pelo menos oito caracteres antes de executar.');
  }
  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO iam.usuarios (username, password, role) VALUES ($1, $2, 'admin')
     ON CONFLICT (username) DO NOTHING RETURNING id, username`,
    [username, hash]
  );
  if (!result.rows.length) {
    throw new Error('Este usuário já existe. Use a interface para gerenciá-lo.');
  }
  console.log('Administrador inicial criado:', result.rows[0].username);
}

main().catch(err => {
  console.error(err.message);
  process.exitCode = 1;
}).finally(() => db.end());
