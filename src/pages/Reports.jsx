import React from 'react';
import ReportCards from '../components/Reports/ReportCards';
import { localStorageManager } from '../utils/localStorage';
import { generateReportData } from '../utils/helpers';
import { FiFileText, FiTrendingUp, FiUsers, FiDollarSign,FiDownload } from 'react-icons/fi';

const Reports = () => {
  const inventory = localStorageManager.getInventory();
  const invoices = localStorageManager.getInvoices();
  const outlets = localStorageManager.getOutlets();

  const reports = {
    inventory: generateReportData('inventory', inventory),
    sales: generateReportData('sales', invoices),
    outlets: generateReportData('outlets', outlets),
    credit: outlets || []
  };

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
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

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
              <p className="text-2xl font-bold">{inventory.length}</p>
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
                ${invoices
                  .filter(inv => inv.status === 'Approved')
                  .reduce((sum, inv) => sum + (inv.total || 0), 0)
                  .toFixed(2)}
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
              <p className="text-2xl font-bold">
                {outlets.filter(o => o.status === 'Active').length}
              </p>
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
                ${outlets.reduce((sum, outlet) => sum + (outlet.currentDue || 0), 0).toFixed(2)}
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
              disabled={!inventory || inventory.length === 0}
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
              disabled={!invoices || invoices.length === 0}
            >
              <FiDownload />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Recent Report Activities</h2>
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
                <td className="py-3 px-4">{inventory.length} items</td>
                <td className="py-3 px-4">Just now</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Sales Report</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Ready
                  </span>
                </td>
                <td className="py-3 px-4">{invoices.length} invoices</td>
                <td className="py-3 px-4">Just now</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Outlet Report</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Ready
                  </span>
                </td>
                <td className="py-3 px-4">{outlets.length} outlets</td>
                <td className="py-3 px-4">Just now</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;