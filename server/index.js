import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
});

pool.query("SELECT NOW()")
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied. Admin privileges required." });
  }
};

// Admin registration
app.post("/api/admin/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const adminCheck = await pool.query(
      "SELECT * FROM admin WHERE email = $1",
      [email]
    );

    if (adminCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await pool.query(
      `INSERT INTO admin (admin_name, email, admin_password) 
       VALUES ($1, $2, $3) RETURNING id, admin_name, email`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "Admin registered successfully",
      admin: newAdmin.rows[0],
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await pool.query(
      "SELECT * FROM admin WHERE email = $1",
      [email]
    );

    if (admin.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(
      password,
      admin.rows[0].admin_password
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: admin.rows[0].id, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin.rows[0].id,
        name: admin.rows[0].admin_name,
        email: admin.rows[0].email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin creates user
app.post(
  "/api/admin/create-user",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { name, password } = req.body;

      if (!name || !password) {
        return res
          .status(400)
          .json({ message: "Name and password are required" });
      }

      const userCheck = await pool.query(
        `SELECT * FROM "user" WHERE user_name = $1`,
        [name]
      );

      if (userCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "User with this name already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await pool.query(
        `INSERT INTO "user" (user_name, user_password, admin_id) 
         VALUES ($1, $2, $3) RETURNING id, user_name`,
        [name, hashedPassword, req.user.id]
      );

      res.status(201).json({
        message: "User created successfully",
        user: newUser.rows[0],
      });
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// User login
app.post("/api/user/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res
        .status(400)
        .json({ message: "Name and password are required" });
    }

    const user = await pool.query(
      `SELECT * FROM "user" WHERE user_name = $1`,
      [name]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid name or password" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].user_password
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid name or password" });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: "user" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].user_name,
      },
    });
  } catch (error) {
    console.error("User login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin fetches all users
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await pool.query(`SELECT * FROM "user"`);

    res.status(200).json({
      message: "Users fetched successfully",
      users: users.rows,
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the Admin API");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
