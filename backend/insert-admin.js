const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'ecommerce',
    password: 'ecommerce123',
    database: 'ecommerce_db'
  });
  await client.connect();
  
  // Create admin hash
  const hash = await bcrypt.hash('admin123', 10);
  
  // Insert or update admin
  await client.query(`
    INSERT INTO "user" (name, email, password, role)
    VALUES ('Administrador', 'admin@ecommerce.com', $1, 'admin')
    ON CONFLICT (email) DO UPDATE SET role = 'admin', password = $1;
  `, [hash]);
  
  console.log('Admin user ready!');
  await client.end();
}

run();
