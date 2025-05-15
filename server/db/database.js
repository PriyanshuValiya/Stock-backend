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
      CREATE TABLE IF NOT EXISTS "admin" (
        id SERIAL PRIMARY KEY,
        admin_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        admin_password VARCHAR(255) NOT NULL
      )
    `); 
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

// Create default admin account if none exists
const createDefaultAdmin = async () => {
  try {
    // Check if admin account exists
    const existingAdmin = await pool.query(
      'SELECT * FROM "admin" WHERE email = $1',
      ['admin@gmail.com']
    );

    if (existingAdmin.rowCount === 0) {
      await pool.query(
        'INSERT INTO "admin" (admin_name, email, admin_password) VALUES ($1, $2, $3)',
        ['Default Admin', 'admin@gmail.com', '$2a$12$wxF7uMoy.vs8pKyNbbbsZONbvGDmOfL3VY3ULU6mY9XmCQOcNo']
      );
      console.log('Default admin account created successfully');
    } else {
      console.log('Admin account already exists');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

const initializeDb = async () => {
  try {
    await createTables();
    await createDefaultAdmin();
  } catch (error) {
    console.error("Database initialization error:", error);
  }
};

export { pool, initializeDb };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  initializeDb().then(() => {
    console.log("Database initialization complete");
    process.exit(0);
  });
}
