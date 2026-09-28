// src/pages/Inventory.jsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import StockLevels from '../components/Inventory/StockLevels';
import {
  FiGrid,
  FiAlertTriangle,
  FiTrendingUp,
  FiPackage,
  FiEye,
  FiX,
  FiMapPin,
  FiBox,
  FiTag,
  FiDollarSign,
  FiLayers,
  FiClock,
} from 'react-icons/fi';
import ApiService from '../utils/ApiService';

const Inventory = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);

  // Pagination for Low Stock table
  const [lowStockPage, setLowStockPage] = useState(1);
  const lowStockItemsPerPage = 20;

  // View inventory modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [summary, setSummary] = useState({
    totalItems: 0,
    totalQuantity: 0,
    uniqueProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    healthPercentage: 0,
  });

  const clientToken = localStorage.getItem('token');
  const storeId = localStorage.getItem('storeId');

  // Fetch inventory summary
  const fetchInventorySummary = async (storeId = 1) => {
    try {
      const response = await ApiService.get(
        `/stores/${storeId}/inventory/summary`,
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('fetchInventorySummary::', response);

      return response;
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  };

  // Fetch inventory list
  const fetchInventoryList = async (storeId = 1) => {
    try {
      const response = await ApiService.get(
        `/inventory/store/${storeId}`,
        {
          headers: {
            Authorization: `Bearer ${clientToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response;
    } catch (error) {
      console.error('Error fetching inventory list:', error);
      throw error;
    }
  };

  // Fetch inventory data
  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);

    try {
      const summaryData = await fetchInventorySummary(storeId);
      setSummary(summaryData);

      const inventoryData = await fetchInventoryList(storeId);
      setInventory(inventoryData);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError(
        'Failed to load inventory data. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Transform API inventory data
  const transformedInventory = inventory.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.Product?.name || 'Unknown Product',
    sku: item.Product?.sku || 'N/A',
    HSN_No: item.Product?.HSN_No || 'N/A',
    category:
      item.Product?.Category?.name || 'Uncategorized',
    quantity: item.quantity,
    unit: 'units',
    price: parseFloat(item.Product?.price) || 0,
    minStock: item.reorderLevel,
    room: item.Room?.name || null,
    rack: item.Rack?.name || null,
    freezer: item.Freezer?.name || null,
    lastUpdated: item.lastUpdated,
    thresholdQuantity:
      item.Product?.thresholdQuantity,
  }));

  // Stock counts
  const lowStockCount = transformedInventory.filter(
    (item) => item.quantity < item.minStock
  ).length;

  const criticalStockCount = transformedInventory.filter(
    (item) => item.quantity < item.minStock * 0.5
  ).length;

  const goodStockCount = transformedInventory.filter(
    (item) => item.quantity >= item.minStock * 1.5
  ).length;

  // Reset low-stock pagination when inventory changes
  useEffect(() => {
    setLowStockPage(1);
  }, [inventory]);

  // Low stock items
  const lowStockItems = transformedInventory.filter(
    (item) => item.quantity < item.minStock
  );

  const lowStockTotalPages = Math.max(
    1,
    Math.ceil(
      lowStockItems.length / lowStockItemsPerPage
    )
  );

  const safeLowStockPage = Math.min(
    lowStockPage,
    lowStockTotalPages
  );

  const lowStockStartIndex =
    (safeLowStockPage - 1) * lowStockItemsPerPage;

  const paginatedLowStockItems = lowStockItems.slice(
    lowStockStartIndex,
    lowStockStartIndex + lowStockItemsPerPage
  );

  const handleLowStockPageChange = (page) => {
    if (
      page >= 1 &&
      page <= lowStockTotalPages
    ) {
      setLowStockPage(page);
    }
  };

  const getLowStockPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      safeLowStockPage -
        Math.floor(maxVisiblePages / 2)
    );

    let endPage = Math.min(
      lowStockTotalPages,
      startPage + maxVisiblePages - 1
    );

    if (
      endPage - startPage + 1 <
      maxVisiblePages
    ) {
      startPage = Math.max(
        1,
        endPage - maxVisiblePages + 1
      );
    }

    for (
      let page = startPage;
      page <= endPage;
      page += 1
    ) {
      pages.push(page);
    }

    return pages;
  };

  // Open View modal
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  // Close View modal
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedProduct(null);
  };

  const tabs = [
    {
      id: 'view',
      label: 'View Inventory',
      icon: FiGrid,
      path: '/inventory',
      badge: transformedInventory.length,
      badgeColor:
        'bg-blue-100 text-blue-800',
    },
    {
      id: 'low-stock',
      label: 'Low Stock',
      icon: FiAlertTriangle,
      path: '/inventory/low-stock',
      badge: lowStockCount,
      badgeColor:
        'bg-red-100 text-red-800',
    },
    {
      id: 'stock-levels',
      label: 'Stock Levels',
      icon: FiTrendingUp,
      path: '/inventory/stock-levels',
      badge: `${criticalStockCount}/${goodStockCount}`,
      badgeColor:
        'bg-purple-100 text-purple-800',
    },
  ];

  // Loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>

          <p className="mt-4 text-gray-600">
            Loading inventory data...
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Error Loading Inventory
        </h3>

        <p className="text-gray-600">
          {error}
        </p>

        <button
          onClick={fetchInventoryData}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Inventory Management
          </h1>

          <p className="text-gray-600">
            Manage and organize your store's stock
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">

            {/* Total Items */}
            <div className="bg-white border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Total Items
                  </p>

                  <p className="text-xl font-bold">
                    {summary.totalItems}
                  </p>
                </div>

                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiPackage className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Quantity */}
            <div className="bg-white border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Total Quantity
                  </p>

                  <p className="text-xl font-bold">
                    {summary.totalQuantity}
                  </p>
                </div>

                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FiPackage className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Unique Products */}
            <div className="bg-white border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Unique Products
                  </p>

                  <p className="text-xl font-bold">
                    {summary.uniqueProducts}
                  </p>
                </div>

                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiGrid className="text-purple-600" />
                </div>
              </div>
            </div>

            {/* Stock Health */}
            <div className="bg-white border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Stock Health
                  </p>

                  <p className="text-xl font-bold">
                    {summary.healthPercentage}%
                  </p>
                </div>

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    parseFloat(
                      summary.healthPercentage
                    ) >= 60
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}
                >
                  <FiTrendingUp
                    className={
                      parseFloat(
                        summary.healthPercentage
                      ) >= 60
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  navigate(tab.path)
                }
                className={`flex items-center space-x-2 px-4 py-3 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  window.location.pathname ===
                  tab.path
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon />

                <span>{tab.label}</span>

                {tab.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      tab.badgeColor ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Routes */}
        <Routes>

          {/* ========================= */}
          {/* VIEW INVENTORY */}
          {/* ========================= */}

          <Route
            path="/"
            element={
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

                <div className="p-5 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Inventory
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {transformedInventory.length}{' '}
                        inventory items
                      </p>
                    </div>
                  </div>
                </div>

                {transformedInventory.length === 0 ? (
                  <div className="text-center py-16">
                    <FiPackage
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />

                    <h3 className="text-lg font-semibold text-gray-700">
                      No inventory found
                    </h3>

                    <p className="text-gray-500 mt-1">
                      There are no inventory items available.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            Product
                          </th>

                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            HSN No
                          </th>

                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            SKU
                          </th>

                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            Category
                          </th>

                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            Quantity
                          </th>

                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            Price
                          </th>

                          <th className="text-left py-3 px-4 font-medium text-gray-600">
                            Stock
                          </th>

                          <th className="text-center py-3 px-4 font-medium text-gray-600">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {transformedInventory.map(
                          (item) => {
                            const percentage =
                              item.minStock > 0
                                ? Math.round(
                                    (item.quantity /
                                      item.minStock) *
                                      100
                                  )
                                : 0;

                            const isLowStock =
                              item.quantity <
                              item.minStock;

                            return (
                              <tr
                                key={item.id}
                                className="border-b hover:bg-gray-50 transition-colors"
                              >
                                {/* Product */}
                                <td className="py-4 px-4">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {item.name}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                      Product ID:{' '}
                                      {item.productId ||
                                        'N/A'}
                                    </p>
                                  </div>
                                </td>

                                {/* HSN */}
                                <td className="py-4 px-4">
                                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                    {item.HSN_No}
                                  </span>
                                </td>

                                {/* SKU */}
                                <td className="py-4 px-4">
                                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                    {item.sku}
                                  </span>
                                </td>

                                {/* Category */}
                                <td className="py-4 px-4">
                                  <span className="text-sm text-gray-700">
                                    {item.category}
                                  </span>
                                </td>

                                {/* Quantity */}
                                <td className="py-4 px-4">
                                  <span
                                    className={`font-semibold ${
                                      isLowStock
                                        ? 'text-red-600'
                                        : 'text-gray-900'
                                    }`}
                                  >
                                    {item.quantity}{' '}
                                    {item.unit}
                                  </span>
                                </td>

                                {/* Price */}
                                <td className="py-4 px-4">
                                  <span className="font-medium">
                                    ₹
                                    {Number(
                                      item.price || 0
                                    ).toFixed(2)}
                                  </span>
                                </td>

                                {/* Stock */}
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${
                                          percentage <
                                          50
                                            ? 'bg-red-500'
                                            : percentage <
                                              100
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                        }`}
                                        style={{
                                          width: `${Math.min(
                                            percentage,
                                            100
                                          )}%`,
                                        }}
                                      />
                                    </div>

                                    <span className="text-xs font-medium">
                                      {percentage}%
                                    </span>
                                  </div>
                                </td>

                                {/* VIEW ONLY */}
                                <td className="py-4 px-4">
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleViewProduct(
                                          item
                                        )
                                      }
                                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                      title="View Inventory Details"
                                    >
                                      <FiEye
                                        size={18}
                                      />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            }
          />

          {/* ========================= */}
          {/* LOW STOCK */}
          {/* ========================= */}

          <Route
            path="/low-stock"
            element={
              <div className="card">

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center space-x-2">
                      <FiAlertTriangle className="text-red-600" />

                      <span>
                        Low Stock Alert
                      </span>
                    </h2>

                    <p className="text-gray-600">
                      {lowStockCount} items below minimum stock level
                    </p>
                  </div>

                  {lowStockCount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700 font-medium">
                        Action Required:{' '}
                        {lowStockCount} items need restocking
                      </p>
                    </div>
                  )}
                </div>

                {lowStockCount === 0 ? (
                  <div className="text-center py-12 bg-green-50 rounded-lg">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiAlertTriangle
                        className="text-green-600"
                        size={24}
                      />
                    </div>

                    <h3 className="text-xl font-bold text-green-800 mb-2">
                      All Stock Levels Good
                    </h3>

                    <p className="text-green-700">
                      No items below minimum stock level
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              Product
                            </th>

                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              HSN_No
                            </th>

                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              SKU
                            </th>

                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              Current Stock
                            </th>

                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              Min Required
                            </th>

                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              Difference
                            </th>

                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              Stock Level
                            </th>

                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              Location
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedLowStockItems.map(
                            (item) => {
                              const percentage =
                                item.minStock > 0
                                  ? Math.round(
                                      (item.quantity /
                                        item.minStock) *
                                        100
                                    )
                                  : 0;

                              const getStockLevelColor =
                                () => {
                                  if (
                                    percentage < 50
                                  ) {
                                    return 'bg-red-100 text-red-800';
                                  }

                                  if (
                                    percentage < 80
                                  ) {
                                    return 'bg-yellow-100 text-yellow-800';
                                  }

                                  return 'bg-orange-100 text-orange-800';
                                };

                              return (
                                <tr
                                  key={item.id}
                                  className="border-b hover:bg-red-50"
                                >
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="font-medium">
                                        {item.name}
                                      </p>

                                      <p className="text-sm text-gray-600">
                                        {item.category}
                                      </p>
                                    </div>
                                  </td>

                                  <td className="py-4 px-4">
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                      {item.HSN_No}
                                    </span>
                                  </td>

                                  <td className="py-4 px-4">
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                      {item.sku}
                                    </span>
                                  </td>

                                  <td className="py-4 px-4">
                                    <span className="font-medium">
                                      {item.quantity}{' '}
                                      {item.unit}
                                    </span>
                                  </td>

                                  <td className="py-4 px-4">
                                    {item.minStock}{' '}
                                    {item.unit}
                                  </td>

                                  <td className="py-4 px-4">
                                    <span className="text-red-600 font-medium">
                                      {item.minStock -
                                        item.quantity}{' '}
                                      {item.unit}
                                    </span>
                                  </td>

                                  <td className="py-4 px-4">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${
                                            percentage <
                                            50
                                              ? 'bg-red-500'
                                              : 'bg-yellow-500'
                                          }`}
                                          style={{
                                            width: `${Math.min(
                                              percentage,
                                              100
                                            )}%`,
                                          }}
                                        />
                                      </div>

                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${getStockLevelColor()}`}
                                      >
                                        {percentage}%
                                      </span>
                                    </div>
                                  </td>

                                  <td className="py-4 px-4">
                                    <div className="text-sm">
                                      {item.room && (
                                        <p className="text-gray-600">
                                          Room:{' '}
                                          {item.room}
                                        </p>
                                      )}

                                      {item.rack && (
                                        <p className="text-gray-600">
                                          Rack:{' '}
                                          {item.rack}
                                        </p>
                                      )}

                                      {item.freezer && (
                                        <p className="text-gray-600">
                                          Freezer:{' '}
                                          {item.freezer}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {lowStockItems.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">

                        <div className="text-sm text-gray-600">
                          Showing{' '}
                          <span className="font-medium">
                            {lowStockStartIndex + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(
                              lowStockStartIndex +
                                lowStockItemsPerPage,
                              lowStockItems.length
                            )}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">
                            {lowStockItems.length}
                          </span>{' '}
                          low stock items
                        </div>

                        <div className="flex items-center gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              handleLowStockPageChange(
                                safeLowStockPage - 1
                              )
                            }
                            disabled={
                              safeLowStockPage === 1
                            }
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                              safeLowStockPage === 1
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Previous
                          </button>

                          {getLowStockPageNumbers().map(
                            (page) => (
                              <button
                                type="button"
                                key={page}
                                onClick={() =>
                                  handleLowStockPageChange(
                                    page
                                  )
                                }
                                className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                  safeLowStockPage ===
                                  page
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleLowStockPageChange(
                                safeLowStockPage + 1
                              )
                            }
                            disabled={
                              safeLowStockPage ===
                              lowStockTotalPages
                            }
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                              safeLowStockPage ===
                              lowStockTotalPages
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Next
                          </button>

                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-red-800 mb-1">
                            Restock Summary
                          </h4>

                          <p className="text-sm text-red-700">
                            Total {lowStockCount}{' '}
                            items need immediate attention
                          </p>
                        </div>

                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          Generate Restock List
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            }
          />

          {/* ========================= */}
          {/* STOCK LEVELS */}
          {/* ========================= */}

          <Route
            path="/stock-levels"
            element={
              <StockLevels
                inventory={transformedInventory}
              />
            }
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Page not found
                </p>
              </div>
            }
          />
        </Routes>
      </div>

      {/* ========================= */}
      {/* VIEW INVENTORY MODAL */}
      {/* ========================= */}

      {showViewModal &&
        selectedProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={closeViewModal}
          >
            <div
              className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Inventory Details
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Complete product and stock information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeViewModal}
                  className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
                  title="Close"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">

                {/* Product Header */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FiPackage
                        size={26}
                        className="text-blue-600"
                      />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedProduct.name}
                      </h3>

                      <p className="text-gray-500 mt-1">
                        {selectedProduct.category}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiTag className="text-blue-600" />
                    Product Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Product ID
                      </p>

                      <p className="font-semibold text-gray-900 break-all">
                        {selectedProduct.productId ||
                          'N/A'}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Inventory ID
                      </p>

                      <p className="font-semibold text-gray-900 break-all">
                        {selectedProduct.id ||
                          'N/A'}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        SKU
                      </p>

                      <p className="font-semibold text-gray-900">
                        {selectedProduct.sku ||
                          'N/A'}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        HSN Number
                      </p>

                      <p className="font-semibold text-gray-900">
                        {selectedProduct.HSN_No ||
                          'N/A'}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Category
                      </p>

                      <p className="font-semibold text-gray-900">
                        {selectedProduct.category ||
                          'N/A'}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Unit
                      </p>

                      <p className="font-semibold text-gray-900">
                        {selectedProduct.unit ||
                          'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiLayers className="text-green-600" />
                    Stock Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <div className="border rounded-xl p-4 bg-green-50">
                      <p className="text-xs text-gray-500 mb-1">
                        Current Quantity
                      </p>

                      <p className="text-2xl font-bold text-green-700">
                        {selectedProduct.quantity}{' '}
                        {selectedProduct.unit}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Minimum Stock
                      </p>

                      <p className="text-xl font-bold text-gray-900">
                        {selectedProduct.minStock}{' '}
                        {selectedProduct.unit}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Threshold Quantity
                      </p>

                      <p className="text-xl font-bold text-gray-900">
                        {selectedProduct.thresholdQuantity ??
                          'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiDollarSign className="text-green-600" />
                    Pricing
                  </h3>

                  <div className="border rounded-xl p-5 bg-green-50">
                    <p className="text-xs text-gray-500 mb-1">
                      Product Price
                    </p>

                    <p className="text-3xl font-bold text-green-700">
                      ₹
                      {Number(
                        selectedProduct.price || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiMapPin className="text-purple-600" />
                    Storage Location
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Room
                      </p>

                      <p className="font-semibold text-gray-900">
                        {selectedProduct.room ||
                          'Not assigned'}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Rack
                      </p>

                      <p className="font-semibold text-gray-900">
                        {selectedProduct.rack ||
                          'Not assigned'}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Freezer
                      </p>

                      <p className="font-semibold text-gray-900">
                        {selectedProduct.freezer ||
                          'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last Updated */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiClock className="text-orange-600" />
                    Last Updated
                  </h3>

                  <div className="border rounded-xl p-4">
                    <p className="font-semibold text-gray-900">
                      {selectedProduct.lastUpdated
                        ? new Date(
                            selectedProduct.lastUpdated
                          ).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Stock Status
                  </h3>

                  <div className="border rounded-xl p-5">
                    {(() => {
                      const quantity =
                        Number(
                          selectedProduct.quantity || 0
                        );

                      const minimum =
                        Number(
                          selectedProduct.minStock || 0
                        );

                      const percentage =
                        minimum > 0
                          ? Math.round(
                              (quantity /
                                minimum) *
                                100
                            )
                          : 0;

                      if (quantity <= 0) {
                        return (
                          <div>
                            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          </div>
                        );
                      }

                      if (quantity < minimum) {
                        return (
                          <div>
                            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              Low Stock
                            </span>

                            <p className="text-sm text-gray-600 mt-2">
                              Current stock is{' '}
                              {percentage}% of the minimum required stock.
                            </p>
                          </div>
                        );
                      }

                      if (
                        quantity >=
                        minimum * 1.5
                      ) {
                        return (
                          <div>
                            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              Good Stock
                            </span>

                            <p className="text-sm text-gray-600 mt-2">
                              Stock level is healthy.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            Normal Stock
                          </span>

                          <p className="text-sm text-gray-600 mt-2">
                            Stock is available but should be monitored.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default Inventory;