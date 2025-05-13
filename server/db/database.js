import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Create tables
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        admin_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        admin_password VARCHAR(255) NOT NULL
      )
    `); // Create user table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admin(id),
        user_name VARCHAR(100) UNIQUE NOT NULL,
        user_password VARCHAR(255) NOT NULL
      )
    `);

    console.log("Database tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

// Initialize database
const initializeDb = async () => {
  try {
    await createTables();
  } catch (error) {
    console.error("Database initialization error:", error);
  }
};

export { pool, initializeDb };

// Run initialization if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  initializeDb().then(() => {
    console.log("Database initialization complete");
    process.exit(0);
  });
}
