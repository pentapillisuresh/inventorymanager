// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import ReportCards from '../components/Reports/ReportCards';
import { generateReportData } from '../utils/helpers';
import { FiFileText, FiTrendingUp, FiUsers, FiDollarSign, FiDownload } from 'react-icons/fi';
import ApiService from '../utils/ApiService';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [reports, setReports] = useState({
    inventory: [],
    sales: [],
    outlets: [],
    credit: []
  });

  const clientToken = localStorage.getItem('token');
  const storeId = localStorage.getItem('storeId');
  const userData = localStorage.getItem('user');
  const userId=JSON.parse(userData).id;

  // Make sure these functions exist in src/services/api.js

 const fetchInventoryList = async (storeId = 1) => {
  try {
    const response = await ApiService.get(`/inventory/store/${storeId}`,{
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching inventory list:', error);
    throw error;
  }
};

 const fetchStoreInvoices = async (page = 1, limit = 100) => {
  try {
    const response = await ApiService.get('/invoice/storeManager', {
      params: { page, limit },
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
    });
    return response;
  } catch (error) {
    console.error('Error fetching store invoices:', error);
    throw error;
  }
};

 const fetchOutlets = async () => {
  try {
    const response = await ApiService.get('/outlets',{
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching outlets:', error);
    throw error;
  }
};

  // Fetch all report data
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch inventory data
      const inventoryData = await fetchInventoryList(storeId);
      setInventory(inventoryData);
      
      // Fetch invoices data
      const invoicesResponse = await fetchStoreInvoices();
      const allInvoices = invoicesResponse.invoices || [];
      setInvoices(allInvoices);
      
      // Fetch outlets data
      const outletsResponse = await fetchOutlets();
      const allOutlets = outletsResponse.outlets || [];
      setOutlets(allOutlets);
      
      // Generate report data
      const inventoryReport = generateReportData('inventory', inventoryData);
      const salesReport = generateReportData('sales', allInvoices);
      const outletsReport = generateReportData('outlets', allOutlets);
      const creditReport = generateReportData('credit', allInvoices);
      
      setReports({
        inventory: inventoryReport,
        sales: salesReport,
        outlets: outletsReport,
        credit: creditReport
      });
      
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleGenerateReport = (reportType) => {
    let data;
    let filename;
    
    switch(reportType) {
      case 'inventory':
        data = reports.inventory;
        filename = 'inventory_report.csv';
        break;
      case 'sales':
        data = reports.sales;
        filename = 'sales_report.csv';
        break;
      case 'outlets':
        data = reports.outlets;
        filename = 'outlets_report.csv';
        break;
      case 'credit':
        data = reports.credit;
        filename = 'credit_report.csv';
        break;
      default:
        return;
    }

    // Check if there's data to export
    if (!data || data.length === 0) {
      alert(`No data available for ${reportType} report`);
      return;
    }

    try {
      // Convert data to CSV
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle undefined/null values and escape quotes in strings
            if (value === null || value === undefined || value === '') return '';
            const stringValue = String(value);
            return stringValue.includes(',') || stringValue.includes('"') 
              ? `"${stringValue.replace(/"/g, '""')}"` 
              : stringValue;
          }).join(',')
        )
      ];

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  // Calculate statistics
  const totalProducts = inventory.length;
  const totalSales = invoices
    .filter(inv => inv.paymentMethod === 'paid' && inv.status === 'completed')
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
  const activeOutlets = outlets.filter(o => o.isActive).length;
  const totalCredit = invoices
    .filter(inv => inv.paymentMethod === 'credit')
    .reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount || 0)), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FiFileText className="mx-auto text-4xl text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Reports</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and download detailed reports</p>
      </div>

      <ReportCards reports={reports} onGenerateReport={handleGenerateReport} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiFileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiTrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold">
                ₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FiUsers className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600">Active Outlets</p>
              <p className="text-2xl font-bold">{activeOutlets}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FiDollarSign className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600">Outstanding Credit</p>
              <p className="text-2xl font-bold">
                ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Generate Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FiFileText className="text-blue-600" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Inventory Report</h3>
            <p className="text-gray-600 mb-4">Complete inventory list with stock levels and locations</p>
            <button 
              onClick={() => handleGenerateReport('inventory')}
              className="btn-primary w-full flex items-center justify-center space-x-2"
              disabled={!reports.inventory || reports.inventory.length === 0}
            >
              <FiDownload />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FiTrendingUp className="text-green-600" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Sales Report</h3>
            <p className="text-gray-600 mb-4">All invoices with status, payments, and totals</p>
            <button 
              onClick={() => handleGenerateReport('sales')}
              className="btn-primary w-full flex items-center justify-center space-x-2"
              disabled={!reports.sales || reports.sales.length === 0}
            >
              <FiDownload />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <FiUsers className="text-purple-600" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Outlet Report</h3>
            <p className="text-gray-600 mb-4">Complete outlet list with credit limits and status</p>
            <button 
              onClick={() => handleGenerateReport('outlets')}
              className="btn-primary w-full flex items-center justify-center space-x-2"
              disabled={!reports.outlets || reports.outlets.length === 0}
            >
              <FiDownload />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FiDollarSign className="text-red-600" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Credit Report</h3>
            <p className="text-gray-600 mb-4">Outstanding credits and payment tracking</p>
            <button 
              onClick={() => handleGenerateReport('credit')}
              className="btn-primary w-full flex items-center justify-center space-x-2"
              disabled={!reports.credit || reports.credit.length === 0}
            >
              <FiDownload />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Report Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Report Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Records</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Inventory Report</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Ready
                  </span>
                </td>
                <td className="py-3 px-4">{reports.inventory.length} items</td>
                <td className="py-3 px-4">{new Date().toLocaleDateString()}</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Sales Report</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Ready
                  </span>
                </td>
                <td className="py-3 px-4">{reports.sales.length} invoices</td>
                <td className="py-3 px-4">{new Date().toLocaleDateString()}</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Outlet Report</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Ready
                  </span>
                </td>
                <td className="py-3 px-4">{reports.outlets.length} outlets</td>
                <td className="py-3 px-4">{new Date().toLocaleDateString()}</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Credit Report</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Ready
                  </span>
                </td>
                <td className="py-3 px-4">{reports.credit.length} credit entries</td>
                <td className="py-3 px-4">{new Date().toLocaleDateString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;