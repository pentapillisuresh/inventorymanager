// src/components/Outlets/OutletStatus.jsx
import React from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiPhone, FiCreditCard } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const OutletStatus = ({ outlet }) => {
  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'active': return <FiCheckCircle className="text-green-500" size={20} />;
      case 'blocked': return <FiXCircle className="text-red-500" size={20} />;
      case 'warning': return <FiAlertCircle className="text-yellow-500" size={20} />;
      default: return <FiCheckCircle className="text-gray-500" size={20} />;
    }
  };

  const getCreditStatus = (currentDue, creditLimit) => {
    const percentage = (currentDue / creditLimit) * 100;
    if (percentage >= 100) return { text: 'Exceeded', color: 'text-red-600', bg: 'bg-red-100' };
    if (percentage >= 80) return { text: 'Critical', color: 'text-red-600', bg: 'bg-red-50' };
    if (percentage >= 60) return { text: 'High', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (percentage >= 30) return { text: 'Moderate', color: 'text-blue-600', bg: 'bg-blue-50' };
    return { text: 'Good', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const creditStatus = getCreditStatus(outlet.currentDue, outlet.creditLimit);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold">{outlet.name}</h3>
          <div className="flex items-center space-x-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${
              outlet.status === 'Active' ? 'bg-green-100 text-green-800' :
              outlet.status === 'Blocked' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {getStatusIcon(outlet.status)}
              <span>{outlet.status}</span>
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
              {outlet.type}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-600">Outlet ID</p>
          <p className="font-mono font-bold">{outlet.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="font-bold text-lg">Contact Information</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPhone className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">{outlet.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Information */}
        <div className="space-y-4">
          <h4 className="font-bold text-lg">Credit Status</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Credit Limit</span>
                <span className="font-bold">{formatCurrency(outlet.creditLimit)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Current Due</span>
                <span className="font-bold">{formatCurrency(outlet.currentDue)}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Available Credit</span>
                <span className="font-bold">{formatCurrency(outlet.creditLimit - outlet.currentDue)}</span>
              </div>
              
              {/* Credit Usage Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Credit Usage</span>
                  <span>{Math.round((outlet.currentDue / outlet.creditLimit) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      outlet.currentDue >= outlet.creditLimit ? 'bg-red-500' :
                      outlet.currentDue > outlet.creditLimit * 0.8 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((outlet.currentDue / outlet.creditLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className={`px-3 py-2 rounded-lg text-center ${creditStatus.bg} ${creditStatus.color}`}>
                <span className="font-medium">Credit Status: {creditStatus.text}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h4 className="font-bold text-lg mb-4">Order Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Can Place Orders</span>
              <span className={`px-2 py-1 rounded text-xs ${
                outlet.status === 'Blocked' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {outlet.status === 'Blocked' ? 'No' : 'Yes'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {outlet.status === 'Blocked' 
                ? 'Blocked due to credit limit exceeded'
                : 'Outlet can place new orders'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment Terms</span>
              <FiCreditCard className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {outlet.currentDue > 0 
                ? `Due: ${formatCurrency(outlet.currentDue)}`
                : 'No outstanding payments'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Credit Utilization</span>
              <span className="font-bold">{Math.round((outlet.currentDue / outlet.creditLimit) * 100)}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {outlet.currentDue === 0 
                ? 'No credit used'
                : `${formatCurrency(outlet.creditLimit - outlet.currentDue)} available`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutletStatus;