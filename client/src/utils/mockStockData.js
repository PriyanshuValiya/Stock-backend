// Generate realistic mock stock data
const stockSymbols = [
  "RELIANCE",
  "INFY",
  "TCS",
  "BHARTIARTL",
  "ASIANPAINT",
  "MARUTI",
  "BAJAJFINSV",
  "LT",
  "NESTLEIND",
  "AXISBANK",
  "MAM",
  "POWERGRID",
  "HDFC",
  "SBI",
]

// Initial base prices for each stock
const baseStockPrices = {
  RELIANCE: 2428.75,
  INFY: 1562.3,
  TCS: 3475.8,
  BHARTIARTL: 842.5,
  ASIANPAINT: 2865.0,
  MARUTI: 10235.0,
  BAJAJFINSV: 1677.8,
  LT: 3244.0,
  NESTLEIND: 24678.0,
  AXISBANK: 1023.0,
  MAM: 1678.5,
  POWERGRID: 245.5,
  HDFC: 2783.8,
  SBI: 677.55,
}

// Previous values to track direction changes
const previousValues = {}

// Define exchange-specific price modifiers
// This will create slight variations in prices across exchanges
const exchangeModifiers = {
  BSE: 1.0,
  NSE: 1.01,
  FUTURES: 1.05,
  OPTIONS: 0.95,
  MCX: 1.02,
  NCDEX: 0.98,
}

// Define which symbols are available on which exchanges
const exchangeAvailability = {
  BSE: stockSymbols,
  NSE: stockSymbols,
  FUTURES: stockSymbols,
  OPTIONS: stockSymbols,
  MCX: stockSymbols,
  NCDEX: stockSymbols,
}

export const generateMockStockData = () => {
  const allStocks = []
  
  // Make sure we have all exchanges defined
  const allExchanges = ["BSE", "NSE", "FUTURES", "OPTIONS", "MCX", "NCDEX"];

  // Generate stocks for each exchange
  allExchanges.forEach((exchange) => {
    // For safety, default to all stock symbols if the exchange isn't defined in exchangeAvailability
    const availableSymbols = exchangeAvailability[exchange] || stockSymbols
    const modifier = exchangeModifiers[exchange] || 1.0

    availableSymbols.forEach((symbol) => {
      const basePrice = baseStockPrices[symbol]

      // Generate random fluctuations (±2%)
      const fluctuationPercent = Math.random() * 4 - 2
      const fluctuation = basePrice * (fluctuationPercent / 100)

      // Update base price with small random change
      if (exchange === "BSE") {
        // Only update base price once
        baseStockPrices[symbol] = basePrice + fluctuation
      }

      // Apply exchange-specific modifier
      const modifiedBasePrice = baseStockPrices[symbol] * modifier

      // Calculate other values based on the modified base price
      const buy = modifiedBasePrice - modifiedBasePrice * 0.005 * Math.random()
      const sell = modifiedBasePrice + modifiedBasePrice * 0.005 * Math.random()
      const high = modifiedBasePrice + modifiedBasePrice * 0.02 * Math.random()
      const low = modifiedBasePrice - modifiedBasePrice * 0.02 * Math.random()
      const open = modifiedBasePrice - fluctuation - modifiedBasePrice * 0.01 * (Math.random() - 0.5)

      // Calculate change from open
      const change = modifiedBasePrice - open

      // Determine last price change direction
      const last = modifiedBasePrice
      let lastChangeDirection = 0

      const prevKey = `${exchange}-${symbol}`
      if (previousValues[prevKey]) {
        if (last > previousValues[prevKey]) {
          lastChangeDirection = 1
        } else if (last < previousValues[prevKey]) {
          lastChangeDirection = -1
        }
      }      // Update previous value
      previousValues[prevKey] = last
      
      allStocks.push({
        symbol,
        exchange,
        buy_price: buy,
        sell_price: sell,
        high,
        low,
        open,
        change,
        last,
        lastChangeDirection,
      })
    })
  })

  return allStocks
}

// Function to get stocks for a specific exchange
export const getMockStocksForExchange = (exchange) => {
  const allStocks = generateMockStockData();
  const filteredStocks = allStocks.filter(stock => stock.exchange === exchange);
  
  // If no stocks found for this exchange, generate some default ones
  if (filteredStocks.length === 0 && stockSymbols.includes("ASIANPAINT")) {
    // Generate at least one stock for this exchange
    const modifier = exchangeModifiers[exchange] || 1.0;
    const symbol = "ASIANPAINT";
    const basePrice = baseStockPrices[symbol];
    
    // Generate basic data for this stock
    const buy_price = basePrice * modifier * 0.995;
    const sell_price = basePrice * modifier * 1.005;
    const high = basePrice * modifier * 1.02;
    const low = basePrice * modifier * 0.98;
    const open = basePrice * modifier * 0.99;
    const last = basePrice * modifier;
    const change = last - open;
    
    return [{
      symbol,
      exchange,
      buy_price,
      sell_price,
      high,
      low,
      open,
      change,
      last,
      lastChangeDirection: 0
    }];
  }
  
  return filteredStocks;
}
