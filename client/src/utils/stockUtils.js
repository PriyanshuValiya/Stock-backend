// Generate random stock data
export const generateRandomStockData = (basePrice = 1000) => {
  const buyPrice = (Math.random() * basePrice + 500).toFixed(2)
  const sellPrice = (Number.parseFloat(buyPrice) * (1 + Math.random() * 0.05)).toFixed(2)
  const high = (Number.parseFloat(sellPrice) * (1 + Math.random() * 0.03)).toFixed(2)
  const low = (Number.parseFloat(buyPrice) * (1 - Math.random() * 0.03)).toFixed(2)
  const open = (Number.parseFloat(low) + Math.random() * (Number.parseFloat(high) - Number.parseFloat(low))).toFixed(2)
  const last = (Number.parseFloat(low) + Math.random() * (Number.parseFloat(high) - Number.parseFloat(low))).toFixed(2)
  const change = (Number.parseFloat(last) - Number.parseFloat(open)).toFixed(2)

  return {
    buy_price: buyPrice,
    sell_price: sellPrice,
    high,
    low,
    open,
    last,
    change,
  }
}

// Format stock price with color based on change
export const formatStockPrice = (price, change) => {
  const formattedPrice = Number.parseFloat(price).toFixed(2)
  const isPositive = Number.parseFloat(change) >= 0

  return {
    value: formattedPrice,
    color: isPositive ? "text-green-500" : "text-red-500",
    icon: isPositive ? "arrow-up" : "arrow-down",
  }
}

// Calculate percentage change
export const calculatePercentChange = (current, previous) => {
  if (!previous) return 0
  return (((current - previous) / previous) * 100).toFixed(2)
}
