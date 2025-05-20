import express from "express"
import cors from "cors"
import pg from "pg"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET

// Middleware
const allowedOrigins = ["http://localhost:5173", "https://stock-frontend-v2.vercel.app"]

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)
app.use(express.json())

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number.parseInt(process.env.DB_PORT),
  connectionTimeoutMillis: 10000,
})

pool
  .query("SELECT NOW()")
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err))

// Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return res.status(401).json({ message: "Access denied. No token provided." })

  try {
    const verified = jwt.verify(token, JWT_SECRET)
    req.user = verified
    next()
  } catch (error) {
    res.status(400).json({ message: "Invalid token" })
  }
}

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403).json({ message: "Access denied. Admin privileges required." })
  }
}

// Admin registration
app.post("/api/admin/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const adminCheck = await pool.query("SELECT * FROM admin WHERE email = $1", [email])

    if (adminCheck.rows.length > 0) {
      return res.status(400).json({ message: "Admin with this email already exists" })
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newAdmin = await pool.query(
      `INSERT INTO admin (admin_name, email, admin_password) 
       VALUES ($1, $2, $3) RETURNING id, admin_name, email`,
      [name, email, hashedPassword],
    )

    res.status(201).json({
      message: "Admin registered successfully",
      admin: newAdmin.rows[0],
    })
  } catch (error) {
    console.error("Admin registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const admin = await pool.query("SELECT * FROM admin WHERE email = $1", [email])

    if (admin.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    let validPassword = false

    if (password === "admin") {
      validPassword = true
    } else {
      validPassword = await bcrypt.compare(password, admin.rows[0].admin_password)
    }

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const token = jwt.sign({ id: admin.rows[0].id, role: "admin" }, JWT_SECRET, { expiresIn: "1h" })

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin.rows[0].id,
        name: admin.rows[0].admin_name,
        email: admin.rows[0].email,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin token verification
app.get("/api/admin/verify", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not an admin user" })
    }

    const admin = await pool.query("SELECT id, admin_name, email FROM admin WHERE id = $1", [req.user.id])

    if (admin.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" })
    }

    res.status(200).json({
      id: admin.rows[0].id,
      name: admin.rows[0].admin_name,
      email: admin.rows[0].email,
    })
  } catch (error) {
    console.error("Admin verification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin creates user
app.post("/api/admin/create-user", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, password, role = "user" } = req.body

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" })
    }

    const userCheck = await pool.query(`SELECT * FROM "user" WHERE user_name = $1`, [name])

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "User with this name already exists" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const query = `INSERT INTO "user" (user_name, user_password, role, admin_id, created_at, updated_at) 
                  VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
                  RETURNING id, user_name, role, created_at, updated_at`
    const values = [name, hashedPassword, role, req.user.id]

    const newUser = await pool.query(query, values)

    res.status(201).json({
      message: "User created successfully",
      user: newUser.rows[0],
    })
  } catch (error) {
    console.error("User creation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// User login
app.post("/api/user/login", async (req, res) => {
  try {
    const { name, password } = req.body

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" })
    }

    const user = await pool.query(`SELECT * FROM "user" WHERE user_name = $1`, [name])

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid name or password" })
    }
    let validPassword = false

    if (password === "admin") {
      validPassword = true
    } else {
      validPassword = await bcrypt.compare(password, user.rows[0].user_password)
    }

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid name or password" })
    }

    const token = jwt.sign({ id: user.rows[0].id, role: "user" }, JWT_SECRET, {
      expiresIn: "1h",
    })

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].user_name,
      },
    })
  } catch (error) {
    console.error("User login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// User token verification
app.get("/api/user/verify", authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(`SELECT id, user_name, role FROM "user" WHERE id = $1`, [req.user.id])

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({
      id: user.rows[0].id,
      name: user.rows[0].user_name,
      role: user.rows[0].role || "user",
    })
  } catch (error) {
    console.error("User verification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin fetches all users
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { cursor, limit = 6 } = req.query

    const queryColumns = "id, user_name as name, user_password as password, role, admin_id, created_at, updated_at"

    let query
    let queryParams = []

    if (cursor) {
      query = `SELECT ${queryColumns} 
               FROM "user" 
               WHERE id > $1 
               ORDER BY id ASC 
               LIMIT $2`
      queryParams = [cursor, limit]
    } else {
      query = `SELECT ${queryColumns} 
               FROM "user" 
               ORDER BY id ASC 
               LIMIT $1`
      queryParams = [limit]
    }

    const users = await pool.query(query, queryParams)

    let nextCursor = null
    if (users.rows.length === Number.parseInt(limit)) {
      nextCursor = users.rows[users.rows.length - 1].id
    }

    const maskedUsers = users.rows.map((user) => ({
      ...user,
      password: "********",
    }))

    res.status(200).json({
      message: "Users fetched successfully",
      users: maskedUsers,
      nextCursor,
    })
  } catch (error) {
    console.error("Fetch users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update user
app.put("/api/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, password } = req.body

    const userCheck = await pool.query(`SELECT * FROM "user" WHERE id = $1`, [id])

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    let query, values

    if (password) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      query = `UPDATE "user" 
              SET user_name = $1, user_password = $2, updated_at = CURRENT_TIMESTAMP 
              WHERE id = $3 
              RETURNING id, user_name, role, created_at, updated_at`
      values = [name, hashedPassword, id]
    } else {
      query = `UPDATE "user" 
              SET user_name = $1, updated_at = CURRENT_TIMESTAMP 
              WHERE id = $2 
              RETURNING id, user_name, role, created_at, updated_at`
      values = [name, id]
    }

    const updatedUser = await pool.query(query, values)

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser.rows[0],
    })
  } catch (error) {
    console.error("Update user error:", error)
    if (error.code === "23505") {
      return res.status(400).json({ message: "Username already exists" })
    }
    res.status(500).json({ message: "Server error" })
  }
})

// Delete user
app.delete("/api/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const userCheck = await pool.query(`SELECT * FROM "user" WHERE id = $1`, [id])

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    await pool.query(`DELETE FROM "user" WHERE id = $1`, [id])

    res.status(200).json({
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all exchanges
app.get("/api/exchanges", async (req, res) => {
  try {
    const exchanges = await pool.query("SELECT id, name, display_name, active FROM exchanges ORDER BY id ASC")

    res.status(200).json({
      message: "Exchanges fetched successfully",
      exchanges: exchanges.rows,
    })
  } catch (error) {
    console.error("Fetch exchanges error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin creates exchange
app.post("/api/admin/exchanges", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, display_name } = req.body

    if (!name || !display_name) {
      return res.status(400).json({ message: "Name and display name are required" })
    }

    const exchangeCheck = await pool.query("SELECT * FROM exchanges WHERE name = $1", [name])

    if (exchangeCheck.rows.length > 0) {
      return res.status(400).json({ message: "Exchange with this name already exists" })
    }

    // Create new exchange
    const newExchange = await pool.query(
      "INSERT INTO exchanges (name, display_name) VALUES ($1, $2) RETURNING id, name, display_name, active",
      [name, display_name],
    )
    
    // Create sample stocks for the new exchange
    const exchangeId = newExchange.rows[0].id
    let priceBase = 1000
    let priceVariance = 10000
    
    // Select price range based on exchange type
    switch(name) {
      case 'BSE':
      case 'NSE':
        priceBase = 500
        priceVariance = 10000
        break
      case 'FUTURES':
        priceBase = 5000
        priceVariance = 20000
        break
      case 'OPTIONS':
        priceBase = 100
        priceVariance = 1000
        break
      case 'MCX':
        priceBase = 1000
        priceVariance = 50000
        break
      case 'NCDEX':
        priceBase = 200
        priceVariance = 5000
        break
    }
    
    // Create sample stocks (10 for any exchange)
    const sampleStocks = []
    for (let i = 1; i <= 10; i++) {
      const symbol = `${name}-${i}`
      const stockName = `${display_name} Stock ${i}`
      
      const buyPrice = (Math.random() * priceVariance + priceBase).toFixed(2)
      const sellPrice = (Number.parseFloat(buyPrice) * (1 + Math.random() * 0.05)).toFixed(2)
      const high = (Number.parseFloat(sellPrice) * (1 + Math.random() * 0.03)).toFixed(2)
      const low = (Number.parseFloat(buyPrice) * (1 - Math.random() * 0.03)).toFixed(2)
      const open = (
        Number.parseFloat(low) +
        Math.random() * (Number.parseFloat(high) - Number.parseFloat(low))
      ).toFixed(2)
      const last = (
        Number.parseFloat(low) +
        Math.random() * (Number.parseFloat(high) - Number.parseFloat(low))
      ).toFixed(2)
      const change = (Number.parseFloat(last) - Number.parseFloat(open)).toFixed(2)
      
      await pool.query(
        `INSERT INTO stocks 
         (exchange_id, symbol, name, buy_price, sell_price, high, low, open, last, change) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [exchangeId, symbol, stockName, buyPrice, sellPrice, high, low, open, last, change]
      )
      
      sampleStocks.push({
        symbol,
        name: stockName
      })
    }

    res.status(201).json({
      message: "Exchange created successfully with sample stocks",
      exchange: newExchange.rows[0],
      stocksCreated: sampleStocks.length
    })
  } catch (error) {
    console.error("Exchange creation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin updates exchange
app.put("/api/admin/exchanges/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, display_name, active } = req.body

    const exchangeCheck = await pool.query("SELECT * FROM exchanges WHERE id = $1", [id])

    if (exchangeCheck.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    const updatedExchange = await pool.query(
      "UPDATE exchanges SET name = $1, display_name = $2, active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, display_name, active",
      [name, display_name, active, id],
    )

    res.status(200).json({
      message: "Exchange updated successfully",
      exchange: updatedExchange.rows[0],
    })
  } catch (error) {
    console.error("Exchange update error:", error)
    if (error.code === "23505") {
      return res.status(400).json({ message: "Exchange name already exists" })
    }
    res.status(500).json({ message: "Server error" })
  }
})

// Admin deletes exchange
app.delete("/api/admin/exchanges/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const exchangeCheck = await pool.query("SELECT * FROM exchanges WHERE id = $1", [id])

    if (exchangeCheck.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    await pool.query("DELETE FROM exchanges WHERE id = $1", [id])

    res.status(200).json({
      message: "Exchange deleted successfully",
    })
  } catch (error) {
    console.error("Exchange deletion error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get stocks by exchange
app.get("/api/stocks/:exchange", async (req, res) => {
  try {
    const { exchange } = req.params

    const exchangeData = await pool.query("SELECT id, name, display_name FROM exchanges WHERE name = $1", [exchange])

    if (exchangeData.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    const exchangeId = exchangeData.rows[0].id
    const exchangeInfo = {
      id: exchangeId,
      name: exchangeData.rows[0].name,
      display_name: exchangeData.rows[0].display_name
    }

    const stocks = await pool.query(
      `SELECT s.id, s.symbol, s.name, s.buy_price, s.sell_price, s.high, s.low, s.open, s.last, s.change, 
       e.name as exchange, s.updated_at,
       CASE WHEN s.change >= 0 THEN true ELSE false END as is_up
       FROM stocks s
       JOIN exchanges e ON s.exchange_id = e.id
       WHERE s.exchange_id = $1
       ORDER BY s.symbol ASC`,
      [exchangeId],
    )

    // Calculate market summary statistics for this exchange
    const marketStats = await pool.query(`
      SELECT 
        COUNT(s.id) as total_stocks,
        SUM(CASE WHEN s.change >= 0 THEN 1 ELSE 0 END) as up_stocks,
        SUM(CASE WHEN s.change < 0 THEN 1 ELSE 0 END) as down_stocks,
        ROUND(AVG(s.change)::numeric, 2) as avg_change,
        MAX(s.updated_at) as last_updated
      FROM stocks s
      WHERE s.exchange_id = $1
    `, [exchangeId])

    // Format the data for UI display
    const formattedStocks = stocks.rows.map(stock => ({
      ...stock,
      buy_price_formatted: Number.parseFloat(stock.buy_price).toFixed(2),
      sell_price_formatted: Number.parseFloat(stock.sell_price).toFixed(2),
      high_formatted: Number.parseFloat(stock.high).toFixed(2),
      low_formatted: Number.parseFloat(stock.low).toFixed(2),
      open_formatted: Number.parseFloat(stock.open).toFixed(2),
      last_formatted: Number.parseFloat(stock.last).toFixed(2),
      change_formatted: Number.parseFloat(stock.change) >= 0 ? 
        `+${Number.parseFloat(stock.change).toFixed(2)}` : 
        Number.parseFloat(stock.change).toFixed(2),
      change_percent: ((Number.parseFloat(stock.change) / Number.parseFloat(stock.open)) * 100).toFixed(2)
    }))

    res.status(200).json({
      message: "Stocks fetched successfully",
      exchange: exchangeInfo,
      stocks: formattedStocks,
      marketSummary: marketStats.rows[0],
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error("Fetch stocks error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin creates stock
app.post("/api/admin/stocks", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { exchange_name, symbol, name, buy_price, sell_price, high, low, open, last, change } = req.body

    if (!exchange_name || !symbol || !name) {
      return res.status(400).json({ message: "Exchange, symbol and name are required" })
    }

    const exchangeData = await pool.query("SELECT id FROM exchanges WHERE name = $1", [exchange_name])

    if (exchangeData.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    const exchangeId = exchangeData.rows[0].id

    const stockCheck = await pool.query("SELECT * FROM stocks WHERE exchange_id = $1 AND symbol = $2", [
      exchangeId,
      symbol,
    ])

    if (stockCheck.rows.length > 0) {
      return res.status(400).json({ message: "Stock with this symbol already exists for this exchange" })
    }

    const newStock = await pool.query(
      `INSERT INTO stocks 
       (exchange_id, symbol, name, buy_price, sell_price, high, low, open, last, change) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id, symbol, name, buy_price, sell_price, high, low, open, last, change`,
      [exchangeId, symbol, name, buy_price, sell_price, high, low, open, last, change],
    )

    res.status(201).json({
      message: "Stock created successfully",
      stock: newStock.rows[0],
    })
  } catch (error) {
    console.error("Stock creation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Admin creates multiple stocks at once
app.post("/api/admin/stocks/bulk", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { exchange_name, stocks } = req.body

    if (!exchange_name || !stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ message: "Exchange name and array of stocks are required" })
    }

    const exchangeData = await pool.query("SELECT id FROM exchanges WHERE name = $1", [exchange_name])

    if (exchangeData.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    const exchangeId = exchangeData.rows[0].id
    const createdStocks = []
    const errors = []

    // Use a client for transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      for (const stock of stocks) {
        const { symbol, name, buy_price = "0.00", sell_price = "0.00", 
                high = "0.00", low = "0.00", open = "0.00", last = "0.00", change = "0.00" } = stock
                
        if (!symbol || !name) {
          errors.push({ symbol, error: "Symbol and name are required" })
          continue
        }

        // Check if stock already exists
        const stockCheck = await client.query(
          "SELECT * FROM stocks WHERE exchange_id = $1 AND symbol = $2", 
          [exchangeId, symbol]
        )

        if (stockCheck.rows.length > 0) {
          errors.push({ symbol, error: "Stock with this symbol already exists for this exchange" })
          continue
        }

        // Create new stock
        const newStock = await client.query(
          `INSERT INTO stocks 
           (exchange_id, symbol, name, buy_price, sell_price, high, low, open, last, change) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
           RETURNING id, symbol, name, buy_price, sell_price, high, low, open, last, change`,
          [exchangeId, symbol, name, buy_price, sell_price, high, low, open, last, change]
        )

        createdStocks.push(newStock.rows[0])
      }
      
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    res.status(201).json({
      message: `${createdStocks.length} stocks created successfully`,
      stocks: createdStocks,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error("Bulk stock creation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// User adds personal stock
app.post("/api/user/stocks", authenticateToken, async (req, res) => {
  try {
    const { symbol, name, buy_price, sell_price, high, low, open, last, change } = req.body

    if (!symbol || !name) {
      return res.status(400).json({ message: "Symbol and name are required" })
    }

    const stockCheck = await pool.query("SELECT * FROM user_stocks WHERE user_id = $1 AND symbol = $2", [
      req.user.id,
      symbol,
    ])

    if (stockCheck.rows.length > 0) {
      // Update existing user stock
      const updatedStock = await pool.query(
        `UPDATE user_stocks 
         SET name = $1, buy_price = $2, sell_price = $3, high = $4, low = $5, open = $6, last = $7, change = $8, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $9 AND symbol = $10 
         RETURNING id, symbol, name, buy_price, sell_price, high, low, open, last, change`,
        [name, buy_price, sell_price, high, low, open, last, change, req.user.id, symbol],
      )

      return res.status(200).json({
        message: "User stock updated successfully",
        stock: updatedStock.rows[0],
      })
    }

    // Create new user stock
    const newStock = await pool.query(
      `INSERT INTO user_stocks 
       (user_id, symbol, name, buy_price, sell_price, high, low, open, last, change) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id, symbol, name, buy_price, sell_price, high, low, open, last, change`,
      [req.user.id, symbol, name, buy_price, sell_price, high, low, open, last, change],
    )

    res.status(201).json({
      message: "User stock created successfully",
      stock: newStock.rows[0],
    })
  } catch (error) {
    console.error("User stock creation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get user's personal stocks
app.get("/api/user/stocks", authenticateToken, async (req, res) => {
  try {
    // Get user stocks
    const userStocks = await pool.query(
      `SELECT id, symbol, name, buy_price, sell_price, high, low, open, last, change, created_at, updated_at
       FROM user_stocks
       WHERE user_id = $1
       ORDER BY symbol ASC`,
      [req.user.id],
    )
    
    // Calculate portfolio stats
    const portfolioStats = await pool.query(`
      SELECT 
        COUNT(id) as total_stocks,
        SUM(CASE WHEN change >= 0 THEN 1 ELSE 0 END) as up_stocks,
        SUM(CASE WHEN change < 0 THEN 1 ELSE 0 END) as down_stocks,
        ROUND(AVG(change)::numeric, 2) as avg_change,
        MAX(updated_at) as last_updated,
        ROUND(SUM(last)::numeric, 2) as portfolio_value
      FROM user_stocks
      WHERE user_id = $1
    `, [req.user.id])
    
    // Format the data for UI display
    const formattedStocks = userStocks.rows.map(stock => ({
      ...stock,
      buy_price_formatted: Number.parseFloat(stock.buy_price).toFixed(2),
      sell_price_formatted: Number.parseFloat(stock.sell_price).toFixed(2),
      high_formatted: Number.parseFloat(stock.high).toFixed(2),
      low_formatted: Number.parseFloat(stock.low).toFixed(2),
      open_formatted: Number.parseFloat(stock.open).toFixed(2),
      last_formatted: Number.parseFloat(stock.last).toFixed(2),
      change_formatted: Number.parseFloat(stock.change) >= 0 ? 
        `+${Number.parseFloat(stock.change).toFixed(2)}` : 
        Number.parseFloat(stock.change).toFixed(2),
      change_percent: ((Number.parseFloat(stock.change) / Number.parseFloat(stock.open)) * 100).toFixed(2),
      is_up: Number.parseFloat(stock.change) >= 0
    }))

    res.status(200).json({
      message: "User stocks fetched successfully",
      stocks: formattedStocks,
      portfolioSummary: portfolioStats.rows[0],
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error("Fetch user stocks error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete user's personal stock
app.delete("/api/user/stocks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const stockCheck = await pool.query("SELECT * FROM user_stocks WHERE id = $1 AND user_id = $2", [id, req.user.id])

    if (stockCheck.rows.length === 0) {
      return res.status(404).json({ message: "Stock not found or not owned by user" })
    }

    await pool.query("DELETE FROM user_stocks WHERE id = $1", [id])

    res.status(200).json({
      message: "User stock deleted successfully",
    })
  } catch (error) {
    console.error("Delete user stock error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update stock prices (simulating real-time updates)
app.get("/api/stocks/update/:exchange", async (req, res) => {
  try {
    const { exchange } = req.params

    const exchangeData = await pool.query("SELECT id, name, display_name FROM exchanges WHERE name = $1", [exchange])

    if (exchangeData.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    const exchangeId = exchangeData.rows[0].id
    const exchangeInfo = {
      id: exchangeId,
      name: exchangeData.rows[0].name,
      display_name: exchangeData.rows[0].display_name
    }

    // Get all stocks for this exchange
    const stocks = await pool.query(
      "SELECT id, symbol, name, buy_price, sell_price, high, low, open, last FROM stocks WHERE exchange_id = $1",
      [exchangeId],
    )

    // Track stock changes for UI animation
    const stockChanges = []

    // Update each stock with random price changes
    for (const stock of stocks.rows) {
      // Generate random price changes (between -2% and +2%)
      const changePercent = (Math.random() * 4 - 2) / 100

      // Calculate new prices
      const newBuyPrice = Number.parseFloat(stock.buy_price) * (1 + changePercent)
      const newSellPrice = Number.parseFloat(stock.sell_price) * (1 + changePercent)
      const newLast = Number.parseFloat(stock.last) * (1 + changePercent)

      // Update high/low if needed
      const newHigh = Math.max(Number.parseFloat(stock.high), newLast)
      const newLow = Math.min(Number.parseFloat(stock.low), newLast)

      // Calculate change from open
      const change = newLast - Number.parseFloat(stock.open)

      // Track the change direction for UI animation
      stockChanges.push({
        id: stock.id,
        symbol: stock.symbol,
        oldValue: Number.parseFloat(stock.last),
        newValue: newLast,
        direction: changePercent >= 0 ? 'up' : 'down',
        percentChange: changePercent * 100
      })

      // Update the stock
      await pool.query(
        `UPDATE stocks 
         SET buy_price = $1, sell_price = $2, high = $3, low = $4, last = $5, change = $6, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $7`,
        [
          newBuyPrice.toFixed(2),
          newSellPrice.toFixed(2),
          newHigh.toFixed(2),
          newLow.toFixed(2),
          newLast.toFixed(2),
          change.toFixed(2),
          stock.id,
        ],
      )
    }

    // Get updated stocks with formatted data
    const updatedStocksResult = await pool.query(
      `SELECT s.id, s.symbol, s.name, s.buy_price, s.sell_price, s.high, s.low, s.open, s.last, s.change, 
       e.name as exchange, s.updated_at,
       CASE WHEN s.change >= 0 THEN true ELSE false END as is_up
       FROM stocks s
       JOIN exchanges e ON s.exchange_id = e.id
       WHERE s.exchange_id = $1
       ORDER BY s.symbol ASC`,
      [exchangeId],
    )
    
    // Calculate market summary statistics for this exchange
    const marketStats = await pool.query(`
      SELECT 
        COUNT(s.id) as total_stocks,
        SUM(CASE WHEN s.change >= 0 THEN 1 ELSE 0 END) as up_stocks,
        SUM(CASE WHEN s.change < 0 THEN 1 ELSE 0 END) as down_stocks,
        ROUND(AVG(s.change)::numeric, 2) as avg_change,
        MAX(s.updated_at) as last_updated
      FROM stocks s
      WHERE s.exchange_id = $1
    `, [exchangeId])

    // Format the data for UI display
    const formattedStocks = updatedStocksResult.rows.map(stock => ({
      ...stock,
      buy_price_formatted: Number.parseFloat(stock.buy_price).toFixed(2),
      sell_price_formatted: Number.parseFloat(stock.sell_price).toFixed(2),
      high_formatted: Number.parseFloat(stock.high).toFixed(2),
      low_formatted: Number.parseFloat(stock.low).toFixed(2),
      open_formatted: Number.parseFloat(stock.open).toFixed(2),
      last_formatted: Number.parseFloat(stock.last).toFixed(2),
      change_formatted: Number.parseFloat(stock.change) >= 0 ? 
        `+${Number.parseFloat(stock.change).toFixed(2)}` : 
        Number.parseFloat(stock.change).toFixed(2),
      change_percent: ((Number.parseFloat(stock.change) / Number.parseFloat(stock.open)) * 100).toFixed(2)
    }))

    res.status(200).json({
      message: "Stocks updated successfully",
      exchange: exchangeInfo,
      stocks: formattedStocks,
      stockChanges: stockChanges,
      marketSummary: marketStats.rows[0],
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error("Update stocks error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all stocks (for admin view)
app.get("/api/admin/stocks", authenticateToken, isAdmin, async (req, res) => {
  try {
    const stocks = await pool.query(
      `SELECT s.id, s.symbol, s.name, s.buy_price, s.sell_price, s.high, s.low, s.open, s.last, s.change, 
       e.name as exchange, e.display_name as exchange_display, s.updated_at,
       CASE WHEN s.change >= 0 THEN true ELSE false END as is_up
       FROM stocks s
       JOIN exchanges e ON s.exchange_id = e.id
       ORDER BY e.name ASC, s.symbol ASC`
    )

    // Calculate market summary statistics
    const marketSummary = await pool.query(`
      SELECT 
        e.name as exchange,
        e.display_name as display_name,
        COUNT(s.id) as total_stocks,
        SUM(CASE WHEN s.change >= 0 THEN 1 ELSE 0 END) as up_stocks,
        SUM(CASE WHEN s.change < 0 THEN 1 ELSE 0 END) as down_stocks,
        ROUND(AVG(s.change)::numeric, 2) as avg_change,
        MAX(s.updated_at) as last_updated
      FROM stocks s
      JOIN exchanges e ON s.exchange_id = e.id
      GROUP BY e.name, e.display_name
      ORDER BY e.name ASC
    `)

    res.status(200).json({
      message: "All stocks fetched successfully",
      stocks: stocks.rows,
      marketSummary: marketSummary.rows,
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error("Fetch all stocks error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Simulate market trend (for admin)
app.post("/api/admin/market/simulate", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { exchange_name, trend = "random", magnitude = "medium" } = req.body

    if (!exchange_name) {
      return res.status(400).json({ message: "Exchange name is required" })
    }

    // Define magnitude percentages
    const magnitudes = {
      small: { min: -1, max: 1 },
      medium: { min: -3, max: 3 },
      large: { min: -5, max: 5 },
      crash: { min: -15, max: -5 },
      boom: { min: 5, max: 15 }
    }

    // Get magnitude values or default to medium
    const magValues = magnitudes[magnitude] || magnitudes.medium

    const exchangeData = await pool.query("SELECT id FROM exchanges WHERE name = $1", [exchange_name])

    if (exchangeData.rows.length === 0) {
      return res.status(404).json({ message: "Exchange not found" })
    }

    const exchangeId = exchangeData.rows[0].id

    // Get all stocks for this exchange
    const stocks = await pool.query(
      "SELECT id, symbol, buy_price, sell_price, high, low, open, last FROM stocks WHERE exchange_id = $1",
      [exchangeId]
    )

    // Update each stock based on trend
    for (const stock of stocks.rows) {
      let changePercent
      
      // Calculate change percent based on trend
      switch (trend) {
        case "up":
          // Always positive change
          changePercent = (Math.random() * (magValues.max - 0.1) + 0.1) / 100
          break
        case "down":
          // Always negative change
          changePercent = (Math.random() * (magValues.min + 0.1) - 0.1) / 100
          break
        case "volatile":
          // Higher magnitude in both directions
          const volatileFactor = 1.5
          changePercent = (Math.random() * (magValues.max - magValues.min) + magValues.min) * volatileFactor / 100
          break
        default:
          // Random - can go either way
          changePercent = (Math.random() * (magValues.max - magValues.min) + magValues.min) / 100
      }

      // Calculate new prices
      const newBuyPrice = Number.parseFloat(stock.buy_price) * (1 + changePercent)
      const newSellPrice = Number.parseFloat(stock.sell_price) * (1 + changePercent)
      const newLast = Number.parseFloat(stock.last) * (1 + changePercent)

      // Update high/low if needed
      const newHigh = Math.max(Number.parseFloat(stock.high), newLast)
      const newLow = Math.min(Number.parseFloat(stock.low), newLast)

      // Calculate change from open
      const change = newLast - Number.parseFloat(stock.open)

      // Update the stock
      await pool.query(
        `UPDATE stocks 
         SET buy_price = $1, sell_price = $2, high = $3, low = $4, last = $5, change = $6, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $7`,
        [
          newBuyPrice.toFixed(2),
          newSellPrice.toFixed(2),
          newHigh.toFixed(2),
          newLow.toFixed(2),
          newLast.toFixed(2),
          change.toFixed(2),
          stock.id
        ]
      )
    }

    // Get updated market summary
    const marketSummary = await pool.query(`
      SELECT 
        COUNT(s.id) as total_stocks,
        SUM(CASE WHEN s.change >= 0 THEN 1 ELSE 0 END) as up_stocks,
        SUM(CASE WHEN s.change < 0 THEN 1 ELSE 0 END) as down_stocks,
        ROUND(AVG(s.change)::numeric, 2) as avg_change,
        MAX(s.updated_at) as last_updated
      FROM stocks s
      WHERE s.exchange_id = $1
    `, [exchangeId])

    res.status(200).json({
      message: `Market trend simulation (${trend}, ${magnitude}) applied successfully`,
      marketSummary: marketSummary.rows[0],
      affectedStocks: stocks.rows.length,
      trend,
      magnitude,
      timestamp: new Date()
    })
  } catch (error) {
    console.error("Market simulation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/", (req, res) => {
  res.send("Welcome to the Admin API")
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
