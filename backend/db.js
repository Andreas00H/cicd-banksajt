import mysql from "mysql2/promise";

// Inställningar för databasen. Standardvärdena passar MAMP på Mac
// (port 8889, användare root, lösenord root). På servern sätts egna
// värden i filen backend/.env.
const config = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 8889),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "root",
};
const databaseName = process.env.DB_NAME ?? "bank";

let pool;

// Hjälpfunktion som gör koden snyggare (samma idé som på lektionen)
export async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Skapar databasen och tabellerna om de inte redan finns
export async function initDatabase() {
  const connection = await mysql.createConnection(config);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await connection.end();

  pool = mysql.createPool({ ...config, database: databaseName });

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    ) AUTO_INCREMENT = 101
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token CHAR(6) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log(`Ansluten till databasen "${databaseName}" på ${config.host}:${config.port}`);
}
