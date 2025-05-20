"use client";

import { useState } from "react";
import { Button } from "./ui/button.jsx";

const AddStockForm = ({ onClose, onAddStock }) => {
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    buy_price: "0.00",
    sell_price: "0.00",
    high: "0.00",
    low: "0.00",
    open: "0.00",
    last: "0.00",
    change: "0.00",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.symbol.trim() || !formData.name.trim()) {
      setError("Symbol and name are required");
      return;
    }

    const numericData = {
      ...formData,
      buy_price: Number.parseFloat(formData.buy_price) || 0,
      sell_price: Number.parseFloat(formData.sell_price) || 0,
      high: Number.parseFloat(formData.high) || 0,
      low: Number.parseFloat(formData.low) || 0,
      open: Number.parseFloat(formData.open) || 0,
      last: Number.parseFloat(formData.last) || 0,
      change: Number.parseFloat(formData.change) || 0,
    };

    onAddStock(numericData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-mono font-semibold text-white">
            Add Personal Stock
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-800 text-white p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="symbol"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Symbol 
              </label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="AAPL"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Name 
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apple Inc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="buy_price"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Buy Price
              </label>
              <input
                type="text"
                id="buy_price"
                name="buy_price"
                value={formData.buy_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="sell_price"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Sell Price
              </label>
              <input
                type="text"
                id="sell_price"
                name="sell_price"
                value={formData.sell_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="high"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                High
              </label>
              <input
                type="text"
                id="high"
                name="high"
                value={formData.high}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="low"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Low
              </label>
              <input
                type="text"
                id="low"
                name="low"
                value={formData.low}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="open"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Open
              </label>
              <input
                type="text"
                id="open"
                name="open"
                value={formData.open}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="last"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Last
              </label>
              <input
                type="text"
                id="last"
                name="last"
                value={formData.last}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="change"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Change
            </label>
            <input
              type="text"
              id="change"
              name="change"
              value={formData.change}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Stock</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockForm;
