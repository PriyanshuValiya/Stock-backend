// import pg from "pg";
// import dotenv from "dotenv";

// dotenv.config();

// const pool = new pg.Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: parseInt(process.env.DB_PORT),
// });

// pool.on('error', (err) => {
//   console.error('Unexpected error on idle client', err);
// });

// const createTables = async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS "admin" (
//         id SERIAL PRIMARY KEY,
//         admin_name VARCHAR(100) NOT NULL,
//         email VARCHAR(100) UNIQUE NOT NULL,
//         admin_password VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       )
//     `); 
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS "user" (
//         id SERIAL PRIMARY KEY,
//         admin_id INTEGER REFERENCES admin(id),
//         user_name VARCHAR(100) UNIQUE NOT NULL,
//         user_password VARCHAR(255) NOT NULL,
//         role VARCHAR(20) DEFAULT 'user' NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     const checkColumns = await pool.query(`
//       SELECT column_name 
//       FROM information_schema.columns 
//       WHERE table_name = 'user' AND (column_name = 'created_at' OR column_name = 'updated_at' OR column_name = 'role')
//     `);

//     await pool.query(`
//       DO $$ 
//       BEGIN 
//         BEGIN
//           ALTER TABLE "user" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
//         EXCEPTION
//           WHEN duplicate_column THEN NULL;
//         END;
        
//         BEGIN
//           ALTER TABLE "user" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
//         EXCEPTION
//           WHEN duplicate_column THEN NULL;
//         END;
        
//         BEGIN
//           ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL;
//         EXCEPTION
//           WHEN duplicate_column THEN NULL;
//         END;
//       END $$;
//     `);

//     console.log("Database tables created successfully");
//   } catch (error) {
//     console.error("Error creating tables:", error);
//   }
// };

// const createDefaultAdmin = async () => {
//   try {
//     const existingAdmin = await pool.query(
//       'SELECT * FROM "admin" WHERE email = $1',
//       ['admin@gmail.com']
//     );

//     if (existingAdmin.rowCount === 0) {
//       await pool.query(
//         'INSERT INTO "admin" (admin_name, email, admin_password) VALUES ($1, $2, $3)',
//         ['Default Admin', 'admin@gmail.com', '$2a$12$wxF7uMoy.vs8pKyNbbbsZONbvGDmOfL3VY3ULU6mY9XmCQOcNo']
//       );
//       console.log('Default admin account created successfully');
//     } else {
//       console.log('Admin account already exists');
//     }
//   } catch (error) {
//     console.error('Error creating default admin:', error);
//   }
// };

// const initializeDb = async () => {
//   try {
//     await createTables();
//     await createDefaultAdmin();
//   } catch (error) {
//     console.error("Database initialization error:", error);
//   }
// };

// export { pool, initializeDb };

// if (process.argv[1] === new URL(import.meta.url).pathname) {
//   initializeDb().then(() => {
//     console.log("Database initialization complete");
//     process.exit(0);
//   });
// }
