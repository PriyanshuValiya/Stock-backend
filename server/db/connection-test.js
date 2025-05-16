// import pg from "pg";
// import dotenv from "dotenv";

// dotenv.config();

// const pool = new pg.Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: parseInt(process.env.DB_PORT),
//   connectionTimeoutMillis: 5000, 
//   query_timeout: 10000 
// });

// pool.query("SELECT NOW()")
//   .then((result) => {
//     console.log("Database connection successful!");
//     pool.end();
//   })
//   .catch((err) => {
//     console.error("Database connection error:", err);
//     pool.end();
//   });
