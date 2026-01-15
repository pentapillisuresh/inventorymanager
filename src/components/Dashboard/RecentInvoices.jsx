// src/components/Dashboard/RecentInvoices.jsx
import React from 'react';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { formatCurrency, getStatusColor } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const RecentInvoices = ({ invoices }) => {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'approved': return <FiCheckCircle className="text-green-500" />;
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'rejected': return <FiXCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Invoices</h2>
        <button 
          onClick={() => navigate('/invoices')}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          View All →
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Invoice ID</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Outlet</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.slice(0, 5).map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="font-medium">{invoice.id}</span>
                </td>
                <td className="py-3 px-4">{invoice.outletName}</td>
                <td className="py-3 px-4">{invoice.date}</td>
                <td className="py-3 px-4 font-semibold">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invoice.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentInvoices;