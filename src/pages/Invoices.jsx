// src/pages/Invoices.jsx
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import InvoiceList from '../components/Invoices/InvoiceList';
import CreateInvoice from '../components/Invoices/CreateInvoice';
import { localStorageManager } from '../utils/localStorage';
import { FiFileText, FiPlus, FiList } from 'react-icons/fi';

const Invoices = () => {
  const navigate = useNavigate();
  const invoices = localStorageManager.getInvoices();
  const pendingCount = invoices.filter(inv => inv.status === 'Pending').length;

  const handleViewInvoice = (invoice) => {
    // Implement view invoice modal or page
    console.log('View invoice:', invoice);
  };

  const tabs = [
    { id: 'list', label: 'All Invoices', icon: FiList, path: '/invoices', badge: invoices.length },
    { id: 'create', label: 'Create Invoice', icon: FiPlus, path: '/invoices/create' },
    { id: 'pending', label: 'Pending', icon: FiFileText, path: '/invoices/pending', badge: pendingCount },
  ];

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
              {tab.badge !== undefined && (
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
            onView={handleViewInvoice} 
          />
        } />
        <Route path="/create" element={<CreateInvoice />} />
        <Route path="/pending" element={
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Pending Invoices</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Invoice ID</th>
                    <th className="text-left py-3 px-4">Outlet</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices
                    .filter(inv => inv.status === 'Pending')
                    .map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-yellow-50">
                        <td className="py-4 px-4 font-medium">{invoice.id}</td>
                        <td className="py-4 px-4">{invoice.outletName}</td>
                        <td className="py-4 px-4">{invoice.date}</td>
                        <td className="py-4 px-4 font-semibold">${invoice.total.toFixed(2)}</td>
                        <td className="py-4 px-4">
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                            Awaiting Admin Approval
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default Invoices;