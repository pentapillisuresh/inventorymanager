// src/pages/Invoices.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import InvoiceList from '../components/Invoices/InvoiceList';
import CreateInvoice from '../components/Invoices/CreateInvoice';
import { FiFileText, FiPlus, FiList } from 'react-icons/fi';
import ApiService from '../utils/ApiService';

const Invoices = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });
  const clientToken = localStorage.getItem('token');
  const storeId = localStorage.getItem('storeId');
  // Update src/services/api.js with new endpoints
  const fetchStoreInvoices = async (page = 1, limit = 10) => {
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

  // Fetch invoices data
  const fetchInvoicesData = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchStoreInvoices(page);
      setInvoices(response.invoices || []);
      setPagination({
        total: response.total || 0,
        totalPages: response.totalPages || 0,
        currentPage: response.currentPage || 1
      });
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoicesData();
  }, []);

  const handleViewInvoice = (invoice) => {
    // Implement view invoice modal or page
    console.log('View invoice:', invoice);
  };

  const tabs = [
    { id: 'list', label: 'All Invoices', icon: FiList, path: '/invoices', badge: invoices.length },
    { id: 'create', label: 'Create Invoice', icon: FiPlus, path: '/invoices/create' }
  ];

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
        <p className="text-gray-600">Create and manage outlet invoices</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center space-x-2 px-4 py-3 font-medium rounded-t-lg transition-colors ${
                window.location.pathname === tab.path
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={
          <InvoiceList 
            invoices={invoices}
            pagination={pagination}
            onPageChange={fetchInvoicesData}
            onView={handleViewInvoice} 
            loading={loading}
          />
        } />
        <Route path="/create" element={<CreateInvoice />} />
      </Routes>
    </div>
  );
};

export default Invoices;