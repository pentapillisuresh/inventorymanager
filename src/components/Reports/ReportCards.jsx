import React from 'react';
import { FiDownload, FiFileText, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const ReportCards = ({ reports, onGenerateReport }) => {
  const reportTypes = [
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Complete stock levels and product details',
      icon: FiFileText,
      color: 'bg-blue-500',
      data: reports.inventory || [],
      format: 'CSV/PDF'
    },
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'Invoice history and revenue analysis',
      icon: FiTrendingUp,
      color: 'bg-green-500',
      data: reports.sales || [],
      format: 'CSV/Excel'
    },
    {
      id: 'outlets',
      title: 'Outlet Report',
      description: 'Outlet performance and credit status',
      icon: FiAlertCircle,
      color: 'bg-purple-500',
      data: reports.outlets || [],
      format: 'CSV/PDF'
    },
    {
      id: 'credit',
      title: 'Credit Report',
      description: 'Outstanding dues and credit limits',
      icon: FiFileText,
      color: 'bg-red-500',
      data: reports.credit || [],
      format: 'PDF'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {reportTypes.map((report) => (
        <div key={report.id} className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${report.color} bg-opacity-10`}>
              <report.icon className={`text-xl ${report.color.replace('bg-', 'text-')}`} />
            </div>
            <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {report.format}
            </span>
          </div>
          
          <h3 className="font-bold text-lg mb-2">{report.title}</h3>
          <p className="text-gray-600 text-sm mb-4">{report.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {report.id === 'inventory' && `${report.data.length} items`}
              {report.id === 'sales' && `${report.data.length} invoices`}
              {report.id === 'outlets' && `${report.data.length} outlets`}
              {report.id === 'credit' && report.data.length > 0 ? 
                `${formatCurrency(report.data.reduce((sum, item) => sum + (item.currentDue || 0), 0))} due` : 
                'No data'}
            </span>
            <button
              onClick={() => onGenerateReport(report.id)}
              className="btn-primary text-sm py-2 px-4 flex items-center space-x-2"
              disabled={!report.data || report.data.length === 0}
            >
              <FiDownload size={14} />
              <span>Generate</span>
            </button>
          </div>
          
          {(!report.data || report.data.length === 0) && (
            <div className="mt-2 text-xs text-yellow-600">
              No data available
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReportCards;