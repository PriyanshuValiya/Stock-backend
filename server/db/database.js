import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number.parseInt(process.env.DB_PORT),
})

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
})

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "admin" (
        id SERIAL PRIMARY KEY,
        admin_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        admin_password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admin(id),
        user_name VARCHAR(100) UNIQUE NOT NULL,
        user_password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create exchanges table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "exchanges" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create stocks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "stocks" (
        id SERIAL PRIMARY KEY,
        exchange_id INTEGER REFERENCES exchanges(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        buy_price DECIMAL(12, 2) NOT NULL,
        sell_price DECIMAL(12, 2) NOT NULL,
        high DECIMAL(12, 2) NOT NULL,
        low DECIMAL(12, 2) NOT NULL,
        open DECIMAL(12, 2) NOT NULL,
        last DECIMAL(12, 2) NOT NULL,
        change DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exchange_id, symbol)
      )
    `)

    // Create user_stocks table for personal values
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user_stocks" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE,
        symbol VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        buy_price DECIMAL(12, 2) NOT NULL,
        sell_price DECIMAL(12, 2) NOT NULL,
        high DECIMAL(12, 2) NOT NULL,
        low DECIMAL(12, 2) NOT NULL,
        open DECIMAL(12, 2) NOT NULL,
        last DECIMAL(12, 2) NOT NULL,
        change DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, symbol)
      )
    `)

    const checkColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user' AND (column_name = 'created_at' OR column_name = 'updated_at' OR column_name = 'role')
    `)

    await pool.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE "user" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;

        BEGIN
          ALTER TABLE "user" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;

        BEGIN
          ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `)

    console.log("Database tables created successfully")
  } catch (error) {
    console.error("Error creating tables:", error)
  }
}

const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await pool.query('SELECT * FROM "admin" WHERE email = $1', ["admin@gmail.com"])

    if (existingAdmin.rowCount === 0) {
      await pool.query('INSERT INTO "admin" (admin_name, email, admin_password) VALUES ($1, $2, $3)', [
        "Default Admin",
        "admin@gmail.com",
        "$2a$12$wxF7uMoy.vs8pKyNbbbsZONbvGDmOfL3VY3ULU6mY9XmCQOcNo",
      ])
      console.log("Default admin account created successfully")
    } else {
      console.log("Admin account already exists")
    }
  } catch (error) {
    console.error("Error creating default admin:", error)
  }
}

const createDefaultExchanges = async () => {
  try {
    const defaultExchanges = [
      { name: "BSE", display_name: "BSE" },
      { name: "NSE", display_name: "NSE" },
      { name: "FUTURES", display_name: "FUTURES" },
      { name: "OPTIONS", display_name: "OPTIONS" },
      { name: "MCX", display_name: "MCX" },
      { name: "NCDEX", display_name: "NCDEX" },
    ]

    for (const exchange of defaultExchanges) {
      const existingExchange = await pool.query("SELECT * FROM exchanges WHERE name = $1", [exchange.name])

      if (existingExchange.rowCount === 0) {
        await pool.query("INSERT INTO exchanges (name, display_name) VALUES ($1, $2)", [
          exchange.name,
          exchange.display_name,
        ])
        console.log(`Exchange ${exchange.name} created successfully`)
      }
    }
  } catch (error) {
    console.error("Error creating default exchanges:", error)
  }
}

const createSampleStocks = async () => {
  try {
    // Get all exchanges
    const exchanges = await pool.query("SELECT id, name FROM exchanges")
    
    if (exchanges.rowCount === 0) {
      console.log("No exchanges found")
      return
    }

    // Define sample stocks for each exchange type
    const exchangeData = {}
    
    // Sample BSE stocks
    exchangeData.BSE = [
      { symbol: "RELIANCE", name: "Reliance Industries Ltd" },
      { symbol: "INFY", name: "Infosys Ltd" },
      { symbol: "TCS", name: "Tata Consultancy Services Ltd" },
      { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd" },
      { symbol: "ASIANPAINT", name: "Asian Paints Ltd" },
      { symbol: "MARUTI", name: "Maruti Suzuki India Ltd" },
      { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd" },
      { symbol: "LT", name: "Larsen & Toubro Ltd" },
      { symbol: "NESTLEIND", name: "Nestle India Ltd" },
      { symbol: "AXISBANK", name: "Axis Bank Ltd" },
    ]
    
    // Sample NSE stocks
    exchangeData.NSE = [
      { symbol: "RELIANCE", name: "Reliance Industries Ltd" },
      { symbol: "HDFCBANK", name: "HDFC Bank Ltd" },
      { symbol: "ICICIBANK", name: "ICICI Bank Ltd" },
      { symbol: "SBIN", name: "State Bank of India" },
      { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd" },
      { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd" },
      { symbol: "ITC", name: "ITC Ltd" },
      { symbol: "TATAMOTORS", name: "Tata Motors Ltd" },
      { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd" },
      { symbol: "WIPRO", name: "Wipro Ltd" },
    ]
    
    // Sample FUTURES
    exchangeData.FUTURES = [
      { symbol: "NIFTY-FUT", name: "Nifty Futures" },
      { symbol: "BANKNIFTY-FUT", name: "Bank Nifty Futures" },
      { symbol: "RELIANCE-FUT", name: "Reliance Futures" },
      { symbol: "TCS-FUT", name: "TCS Futures" },
      { symbol: "HDFCBANK-FUT", name: "HDFC Bank Futures" },
      { symbol: "INFY-FUT", name: "Infosys Futures" },
      { symbol: "SBIN-FUT", name: "SBI Futures" },
      { symbol: "ICICIBANK-FUT", name: "ICICI Bank Futures" },
      { symbol: "TATASTEEL-FUT", name: "Tata Steel Futures" },
      { symbol: "AXISBANK-FUT", name: "Axis Bank Futures" },
    ]
    
    // Sample OPTIONS
    exchangeData.OPTIONS = [
      { symbol: "NIFTY-OPT-18000-CE", name: "Nifty 18000 Call Option" },
      { symbol: "NIFTY-OPT-18000-PE", name: "Nifty 18000 Put Option" },
      { symbol: "NIFTY-OPT-18500-CE", name: "Nifty 18500 Call Option" },
      { symbol: "NIFTY-OPT-18500-PE", name: "Nifty 18500 Put Option" },
      { symbol: "BANKNIFTY-OPT-40000-CE", name: "Bank Nifty 40000 Call Option" },
      { symbol: "BANKNIFTY-OPT-40000-PE", name: "Bank Nifty 40000 Put Option" },
      { symbol: "RELIANCE-OPT-2500-CE", name: "Reliance 2500 Call Option" },
      { symbol: "RELIANCE-OPT-2500-PE", name: "Reliance 2500 Put Option" },
      { symbol: "INFY-OPT-1500-CE", name: "Infosys 1500 Call Option" },
      { symbol: "INFY-OPT-1500-PE", name: "Infosys 1500 Put Option" },
    ]
    
    // Sample MCX (Commodities)
    exchangeData.MCX = [
      { symbol: "GOLD", name: "Gold" },
      { symbol: "SILVER", name: "Silver" },
      { symbol: "CRUDEOIL", name: "Crude Oil" },
      { symbol: "NATURALGAS", name: "Natural Gas" },
      { symbol: "COPPER", name: "Copper" },
      { symbol: "NICKEL", name: "Nickel" },
      { symbol: "LEAD", name: "Lead" },
      { symbol: "ZINC", name: "Zinc" },
      { symbol: "ALUMINIUM", name: "Aluminium" },
      { symbol: "COTTON", name: "Cotton" },
    ]
    
    // Sample NCDEX (Agricultural Commodities)
    exchangeData.NCDEX = [
      { symbol: "DHANIYA", name: "Coriander" },
      { symbol: "CASTOR", name: "Castor Seed" },
      { symbol: "GUARGUM", name: "Guar Gum" },
      { symbol: "GUARSEED", name: "Guar Seed" },
      { symbol: "JEERAUNJHA", name: "Cumin Seed" },
      { symbol: "SOYBEAN", name: "Soybean" },
      { symbol: "CHANA", name: "Chickpea" },
      { symbol: "RBDPMOLEIN", name: "RBD Palmolein" },
      { symbol: "KAPAS", name: "Cotton" },
      { symbol: "COCUDAKL", name: "Coconut Oil Cake" },
    ]
    
    for (const exchange of exchanges.rows) {
      const exchangeName = exchange.name
      const exchangeId = exchange.id
      
      if (!exchangeData[exchangeName]) {
        console.log(`No sample data defined for exchange: ${exchangeName}`)
        continue
      }
      
      const sampleStocks = exchangeData[exchangeName].map(stock => ({
        ...stock,
        exchange_id: exchangeId
      }))
      
      for (const stock of sampleStocks) {
        const existingStock = await pool.query("SELECT * FROM stocks WHERE exchange_id = $1 AND symbol = $2", [
          stock.exchange_id,
          stock.symbol,
        ])
        
        if (existingStock.rowCount === 0) {
          let priceBase = 1000;
          let priceVariance = 10000;
          
          switch(exchange.name) {
            case 'BSE':
            case 'NSE':
              priceBase = 500;
              priceVariance = 10000;
              break;
            case 'FUTURES':
              priceBase = 5000;
              priceVariance = 20000;
              break;
            case 'OPTIONS':
              priceBase = 100;
              priceVariance = 1000;
              break;
            case 'MCX':
              priceBase = 1000;
              priceVariance = 50000;
              break;
            case 'NCDEX':
              priceBase = 200;
              priceVariance = 5000;
              break;
          }
          
          const buyPrice = (Math.random() * priceVariance + priceBase).toFixed(2);
          const sellPrice = (Number.parseFloat(buyPrice) * (1 + Math.random() * 0.05)).toFixed(2);
          const high = (Number.parseFloat(sellPrice) * (1 + Math.random() * 0.03)).toFixed(2);
          const low = (Number.parseFloat(buyPrice) * (1 - Math.random() * 0.03)).toFixed(2);
          const open = (
            Number.parseFloat(low) +
            Math.random() * (Number.parseFloat(high) - Number.parseFloat(low))
          ).toFixed(2);
          const last = (
            Number.parseFloat(low) +
            Math.random() * (Number.parseFloat(high) - Number.parseFloat(low))
          ).toFixed(2);
          const change = (Number.parseFloat(last) - Number.parseFloat(open)).toFixed(2);
          
          await pool.query(
            `INSERT INTO stocks 
             (exchange_id, symbol, name, buy_price, sell_price, high, low, open, last, change) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [stock.exchange_id, stock.symbol, stock.name, buyPrice, sellPrice, high, low, open, last, change]
          );
          console.log(`Stock ${stock.symbol} created successfully for ${exchange.name}`);
        }
      }
      
      console.log(`Processed stocks for exchange: ${exchange.name}`);
    }
  } catch (error) {
    console.error("Error creating sample stocks:", error);
  }
}

const initializeDb = async () => {
  try {
    await createTables()
    await createDefaultAdmin()
    await createDefaultExchanges()
    await createSampleStocks()
  } catch (error) {
    console.error("Database initialization error:", error)
  }
}

export { pool, initializeDb }

if (process.argv[1] === new URL(import.meta.url).pathname) {
  initializeDb().then(() => {
    console.log("Database initialization complete")
    process.exit(0)
  })
}
