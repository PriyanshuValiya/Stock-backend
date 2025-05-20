/* eslint-disable no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "../context/useUser";
import { Button } from "./ui/button";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PlusCircleIcon,
  RefreshCw,
} from "lucide-react";
import AddStockForm from "./AddStockForm";
import AddExchangeForm from "./AddExchangeForm";
import {
  generateMockStockData,
  getMockStocksForExchange,
} from "../utils/mockStockData";

const StockMarket = ({ openExchangeForm = false }) => {
  const { user } = useUser();
  const [exchanges, setExchanges] = useState([]);
  const [selectedExchange, setSelectedExchange] = useState("BSE");
  const [stocks, setStocks] = useState([]);
  const [userStocks, setUserStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddStockForm, setShowAddStockForm] = useState(false);
  const [showAddExchangeForm, setShowAddExchangeForm] =
    useState(openExchangeForm);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchExchanges = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/exchanges");
      if (!response.ok) {
        throw new Error("Failed to fetch exchanges");
      }
      const data = await response.json();
      setExchanges(data.exchanges.filter((exchange) => exchange.active));
    } catch (error) {
      console.error("Error fetching exchanges:", error);
    }
  };

  const fetchStocks = useCallback(async (exchange) => {
    try {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/stocks/${exchange}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log(
            `Fetched ${data.stocks.length} stocks for exchange ${exchange}:`,
            data.stocks
          );
          setStocks(data.stocks);
          setLastUpdated(new Date());
          return;
        }
      } catch (error) {
        console.log("Error: ", error);
      }
      const mockStocks = getMockStocksForExchange(exchange);
      console.log(
        `Fetched ${mockStocks.length} stocks for exchange ${exchange}:`,
        mockStocks
      );

      if (mockStocks.length > 0) {
        setStocks(mockStocks);
      } else {
        // If still no stocks, make sure we have at least a placeholder
        setStocks([
          {
            id: `${exchange}-placeholder`,
            symbol: "ASIANPAINT",
            exchange: exchange,
            buy_price: 2865.0,
            sell_price: 2870.0,
            high: 2880.0,
            low: 2850.0,
            open: 2860.0,
            last: 2865.0,
            change: 5.0,
            lastChangeDirection: 1,
          },
        ]);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserStocks = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch("http://localhost:3000/api/user/stocks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user stocks");
      const data = await response.json();
      setUserStocks(data.stocks);
    } catch (error) {
      console.error("Error fetching user stocks:", error);
    }
  }, [user]);

  const updateStockPrices = useCallback(async () => {
    try {
      setRefreshing(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/stocks/update/${selectedExchange}`
        );
        if (response.ok) {
          const data = await response.json();
          setStocks(data.stocks);
          setLastUpdated(new Date());
          return;
        }
      } catch (error) {
        console.log("API not available, using mock data instead");
      }
      const mockStocks = getMockStocksForExchange(selectedExchange);

      if (mockStocks.length > 0) {
        setStocks(mockStocks);
      } else {
        // If still no stocks, make sure we have at least a placeholder
        setStocks([
          {
            id: `${selectedExchange}-placeholder`,
            symbol: "ASIANPAINT",
            exchange: selectedExchange,
            buy_price: 2865.0,
            sell_price: 2870.0,
            high: 2880.0,
            low: 2850.0,
            open: 2860.0,
            last: 2865.0,
            change: 5.0,
            lastChangeDirection: 1,
          },
        ]);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error updating stocks:", error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedExchange]);

  useEffect(() => {
    fetchExchanges();
  }, []);

  useEffect(() => {
    if (selectedExchange) {
      fetchStocks(selectedExchange);
    }
  }, [selectedExchange, fetchStocks]);

  useEffect(() => {
    fetchUserStocks();
  }, [fetchUserStocks]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (selectedExchange && !refreshing) {
        updateStockPrices();
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [selectedExchange, refreshing, updateStockPrices]);

  const handleExchangeClick = (exchange) => {
    setSelectedExchange(exchange);
  };

  const handleAddUserStock = async (newStock) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to add stocks");
        return;
      }

      const response = await fetch("http://localhost:3000/api/user/stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStock),
      });

      if (!response.ok) throw new Error("Failed to add stock");
      fetchUserStocks();
      setShowAddStockForm(false);
    } catch (error) {
      console.error("Error adding user stock:", error);
      alert("Failed to add stock: " + error.message);
    }
  };

  const handleDeleteUserStock = async (stockId) => {
    if (!window.confirm("Are you sure you want to delete this stock?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to delete stocks");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/user/stocks/${stockId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete stock");
      fetchUserStocks();
    } catch (error) {
      console.error("Error deleting user stock:", error);
      alert("Failed to delete stock: " + error.message);
    }
  };
  const handleAddExchange = async (newExchange) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in as admin to add exchanges");
        return;
      }

      const response = await fetch(
        "http://localhost:3000/api/admin/exchanges",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newExchange),
        }
      );

      if (!response.ok) throw new Error("Failed to add exchange");

      const data = await response.json();
      alert(
        `Exchange "${newExchange.display_name}" created successfully with ${data.stocksCreated} sample stocks. All users will see the new exchange.`
      );

      fetchExchanges();
      // Set the newly created exchange as selected
      setSelectedExchange(newExchange.name);
      setShowAddExchangeForm(false);

      // Fetch stocks for the new exchange
      fetchStocks(newExchange.name);
    } catch (error) {
      console.error("Error adding exchange:", error);
      alert("Failed to add exchange: " + error.message);
    }
  };
  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <h2 className="text-lg font-medium mt-5 mb-2 sm:mb-0">Market Segments</h2>
          <div className="flex items-center space-x-2">
            {user && user.role === "admin" && (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => setShowAddExchangeForm(true)}
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Exchange
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {exchanges.map((exchange) => (
            <Button
              key={exchange.id}
              variant={
                selectedExchange === exchange.name ? "default" : "outline"
              }
              onClick={() => handleExchangeClick(exchange.name)}
              className="min-w-[80px]"
            >
              {exchange.display_name}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg mb-8">
        <div className="flex items-center justify-between p-4 bg-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {selectedExchange} Market Data
          </h2>
          {user && user.role == "user" && (
            <Button
              size="sm"
              onClick={() => setShowAddStockForm(true)}
              className="flex items-center gap-1"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Add Personal Stock
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ex
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Buy
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Sell
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  High
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Low
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Open
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-4 text-center text-gray-400"
                  >
                    Loading stock data...
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-4 text-center text-gray-400"
                  >
                    No stocks available for this exchange.
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {stock.exchange}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                      {stock.symbol}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                      {Number.parseFloat(stock.buy_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                      {Number.parseFloat(stock.sell_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                      {Number.parseFloat(stock.high).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                      {Number.parseFloat(stock.low).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                      {Number.parseFloat(stock.open).toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        Number.parseFloat(stock.change) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {Number.parseFloat(stock.change) >= 0 ? (
                        <span className="flex items-center justify-end">
                          +{Number.parseFloat(stock.change).toFixed(2)}
                          <ArrowUpIcon className="h-4 w-4 ml-1" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-end">
                          {Number.parseFloat(stock.change).toFixed(2)}
                          <ArrowDownIcon className="h-4 w-4 ml-1" />
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        Number.parseFloat(stock.change) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {Number.parseFloat(stock.last).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {user && userStocks.length > 0 && (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="p-4 bg-gray-700">
            <h2 className="text-xl font-semibold">Your Personal Stocks</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Buy
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sell
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {userStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                      {stock.symbol}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {stock.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                      {Number.parseFloat(stock.buy_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                      {Number.parseFloat(stock.sell_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                      {Number.parseFloat(stock.last).toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                        Number.parseFloat(stock.change) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {Number.parseFloat(stock.change) >= 0 ? (
                        <span className="flex items-center justify-end">
                          +{Number.parseFloat(stock.change).toFixed(2)}
                          <ArrowUpIcon className="h-4 w-4 ml-1" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-end">
                          {Number.parseFloat(stock.change).toFixed(2)}
                          <ArrowDownIcon className="h-4 w-4 ml-1" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUserStock(stock.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddStockForm && (
        <AddStockForm
          onClose={() => setShowAddStockForm(false)}
          onAddStock={handleAddUserStock}
        />
      )}

      {showAddExchangeForm && (
        <AddExchangeForm
          onClose={() => setShowAddExchangeForm(false)}
          onAddExchange={handleAddExchange}
        />
      )}
    </div>
  );
};

export default StockMarket;
