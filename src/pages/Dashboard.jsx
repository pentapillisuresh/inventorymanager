// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import StatsCards from '../components/Dashboard/StatsCards';
import RecentInvoices from '../components/Dashboard/RecentInvoices';
import LowStockAlert from '../components/Dashboard/LowStockAlert';
import ApiService from '../utils/ApiService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStockValue: 0,
    lowStockItems: 0,
    pendingInvoices: 0,
    activeOutlets: 0,
    totalCredit: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoicesPagination, setInvoicesPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    total: 0
  });
  const clientToken = localStorage.getItem('token');
  const storeId = localStorage.getItem('storeId');
  
  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch inventory summary for stats
      const summaryData = await fetchInventorySummary(storeId);
      console.log("rrr::",summaryData)
      // Transform API response to match StatsCards expected format
      setStats({
        totalItems: summaryData.totalItems || 0,
        totalQuantity: summaryData.totalQuantity || 0,
        uniqueProducts: summaryData.uniqueProducts || 0,
        lowStockCount: summaryData.lowStockCount || 0,
        outOfStockCount: summaryData.outOfStockCount || 0,
        healthPercentage: summaryData.healthPercentage || 0
      });

      // Fetch low stock items
      const lowStockData = await fetchLowStockItems(storeId);
      setLowStockItems(lowStockData);

      // Fetch invoices with pagination
      const invoicesData = await fetchInvoices(storeId);
      setInvoices(invoicesData.invoices);
      setInvoicesPagination({
        currentPage: invoicesData.currentPage,
        totalPages: invoicesData.totalPages,
        total: invoicesData.total
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };


  // Fetch inventory summary
 const fetchInventorySummary = async (storeId = 1) => {
  try {
    const response = await ApiService.get(`/stores/${storeId}/inventory/summary`,{
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log("fetchInventorySummary::",response)
    return response;
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    throw error;
  }
};

// Fetch low stock items
 const fetchLowStockItems = async (storeId = 1) => {
  try {
    const response = await ApiService.get(`/stores/${storeId}/inventory/low-stock`,{
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log("fetchLowStockItems::",response)

    return response;
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    throw error;
  }
};

// Fetch invoices with pagination
const fetchInvoices = async (page = 1, limit = 5, storeId = 1) => {
  try {
    const response = await ApiService.get(`/stores/${storeId}/invoices`, {
      params: {
        page,
        limit
      },
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
    });
    console.log("fetchInvoices::",response)
    return response;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}
  // Handle pagination for invoices
  const handlePageChange = async (page) => {
    try {
      const invoicesData = await fetchInvoices(page);
      setInvoices(invoicesData.invoices);
      setInvoicesPagination({
        currentPage: invoicesData.currentPage,
        totalPages: invoicesData.totalPages,
        total: invoicesData.total
      });
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your store's performance and activities</p>
      </div>

      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentInvoices 
            invoices={invoices}
            pagination={invoicesPagination}
            onPageChange={handlePageChange}
          />
        </div>
        <div className="lg:col-span-1">
          <LowStockAlert lowStockItems={lowStockItems} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;