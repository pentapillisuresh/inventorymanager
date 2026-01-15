// src/components/Invoices/InvoiceStatus.jsx
import React from 'react';
import { FiCheckCircle, FiClock, FiXCircle, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const InvoiceStatus = ({ invoice }) => {
  const getStatusInfo = (status) => {
    switch(status.toLowerCase()) {
      case 'approved':
        return {
          icon: FiCheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
          message: 'Invoice approved and stock issued'
        };
      case 'pending':
        return {
          icon: FiClock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          message: 'Waiting for admin approval'
        };
      case 'rejected':
        return {
          icon: FiXCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          message: invoice.reason || 'Invoice rejected by admin'
        };
      default:
        return {
          icon: FiFileText,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          message: 'Invoice created'
        };
    }
  };

  const statusInfo = getStatusInfo(invoice.status);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold">Invoice #{invoice.id}</h3>
          <div className="flex items-center space-x-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${statusInfo.bg} ${statusInfo.color}`}>
              <statusInfo.icon size={16} />
              <span>{invoice.status}</span>
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              invoice.payment === 'Paid' 
                ? 'bg-green-100 text-green-800'
                : invoice.payment === 'Credit'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {invoice.payment}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-600">Date</p>
          <p className="font-bold">{invoice.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Outlet Information */}
        <div className="space-y-4">
          <h4 className="font-bold text-lg">Outlet Details</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Outlet Name</span>
              <span className="font-medium">{invoice.outletName}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Outlet ID</span>
              <span className="font-mono">{invoice.outletId}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-4">
          <h4 className="font-bold text-lg">Payment Details</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">{invoice.payment}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Due Date</span>
                <span className="font-medium flex items-center space-x-2">
                  <FiCalendar />
                  <span>{invoice.dueDate}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-4 rounded-lg mb-6 ${statusInfo.bg}`}>
        <div className="flex items-center space-x-3">
          <statusInfo.icon className={`text-xl ${statusInfo.color}`} />
          <div>
            <p className="font-medium">{statusInfo.message}</p>
            {invoice.reason && invoice.status === 'Rejected' && (
              <p className="text-sm mt-1">Reason: {invoice.reason}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {invoice.status === 'Pending' && (
        <div className="space-y-3">
          <p className="text-gray-600">This invoice is waiting for admin approval. You cannot modify it once submitted.</p>
          <div className="flex space-x-3">
            <button className="btn-secondary flex-1">
              View Details
            </button>
            <button className="btn-primary flex-1">
              Contact Admin
            </button>
          </div>
        </div>
      )}

      {invoice.status === 'Approved' && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FiCheckCircle className="text-green-600" />
              <div>
                <p className="font-medium text-green-800">Invoice Approved</p>
                <p className="text-sm text-green-700">Stock has been issued to the outlet</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="btn-primary flex-1">
              View Stock Issuance
            </button>
            <button className="btn-secondary flex-1">
              Download Invoice
            </button>
          </div>
        </div>
      )}

      {invoice.status === 'Rejected' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FiXCircle className="text-red-600" />
              <div>
                <p className="font-medium text-red-800">Invoice Rejected</p>
                <p className="text-sm text-red-700">Please review and resubmit with corrections</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="btn-primary flex-1">
              Create New Invoice
            </button>
            <button className="btn-secondary flex-1">
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceStatus;