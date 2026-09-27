// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import ReportCards from '../components/Reports/ReportCards';
import { generateReportData } from '../utils/helpers';
import { FiFileText, FiTrendingUp, FiUsers, FiDollarSign, FiDownload } from 'react-icons/fi';
import ApiService from '../utils/ApiService';
import jsPDF from 'jspdf';

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

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined || value === '') return '';

    let stringValue;

    if (typeof value === 'object') {
      try {
        stringValue = JSON.stringify(value);
      } catch {
        stringValue = String(value);
      }
    } else {
      stringValue = String(value);
    }

    return stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue;
  };

  const getReportData = (reportType) => {
    switch (reportType) {
      case 'inventory':
        return reports.inventory;
      case 'sales':
        return reports.sales;
      case 'outlets':
        return reports.outlets;
      case 'credit':
        return reports.credit;
      default:
        return [];
    }
  };

  const getReportTitle = (reportType) => {
    return `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
  };

  const formatPdfValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const addPdfText = (doc, text, x, y, maxWidth, lineHeight = 5) => {
    const safeText = String(text ?? '-');
    const lines = doc.splitTextToSize(safeText, maxWidth);

    let currentY = y;

    lines.forEach((line) => {
      if (currentY > 280) {
        doc.addPage();
        currentY = 18;
      }

      doc.text(line, x, currentY);
      currentY += lineHeight;
    });

    return currentY;
  };

  const downloadPdfReport = (reportType, data) => {
    if (!data || data.length === 0) {
      alert(`No data available for ${reportType} report`);
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const title = getReportTitle(reportType);
    const generatedDate = new Date().toLocaleString('en-IN');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    const addHeader = () => {
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${generatedDate}`, margin, 20);

      doc.setTextColor(31, 41, 55);
    };

    addHeader();

    let y = 38;

    // Summary information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Summary', margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const summaryValues = [
      ['Report Type', title],
      ['Records', String(data.length)],
      ['Generated On', generatedDate]
    ];

    summaryValues.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 32, y);
      y += 5;
    });

    y += 5;

    // Determine columns from the actual report data.
    const headers = Object.keys(data[0] || {});

    if (headers.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('No report columns available.', margin, y);
      doc.save(`${reportType}_report.pdf`);
      return;
    }

    // Keep the PDF readable even when API data contains many columns.
    // Long/nested values are shortened in cells but the full data remains available in CSV.
    const maxColumns = 8;
    const visibleHeaders = headers.slice(0, maxColumns);

    const availableWidth = pageWidth - margin * 2;
    const columnWidth = availableWidth / visibleHeaders.length;
    const headerHeight = 9;
    const rowHeight = 7;

    const drawTableHeader = () => {
      if (y + headerHeight > pageHeight - 12) {
        doc.addPage();
        addHeader();
        y = 38;
      }

      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(209, 213, 219);
      doc.rect(
        margin,
        y - 5,
        availableWidth,
        headerHeight,
        'FD'
      );

      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);

      visibleHeaders.forEach((header, index) => {
        const x = margin + index * columnWidth + 2;
        const headerText = doc.splitTextToSize(
          String(header),
          Math.max(columnWidth - 4, 10)
        )[0];

        doc.text(headerText, x, y);
      });

      y += headerHeight;
      doc.setFont('helvetica', 'normal');
    };

    drawTableHeader();

    data.forEach((row) => {
      const cellValues = visibleHeaders.map((header) => {
        let value = formatPdfValue(row?.[header]);

        // Keep cells compact and readable.
        if (value.length > 45) {
          value = `${value.substring(0, 42)}...`;
        }

        return value;
      });

      const wrappedCells = cellValues.map((value) =>
        doc.splitTextToSize(value, Math.max(columnWidth - 4, 10))
      );

      const requiredHeight = Math.max(
        rowHeight,
        ...wrappedCells.map((lines) => lines.length * 3.5 + 3)
      );

      if (y + requiredHeight > pageHeight - 12) {
        doc.addPage();
        addHeader();
        y = 38;
        drawTableHeader();
      }

      doc.setDrawColor(229, 231, 235);
      doc.setFontSize(6.5);

      if (Math.floor(data.indexOf(row)) % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(
          margin,
          y - 4,
          availableWidth,
          requiredHeight,
          'F'
        );
      }

      wrappedCells.forEach((lines, index) => {
        const x = margin + index * columnWidth + 2;

        lines.forEach((line, lineIndex) => {
          doc.text(line, x, y + lineIndex * 3.5);
        });

        doc.line(
          margin + index * columnWidth,
          y - 4,
          margin + index * columnWidth,
          y + requiredHeight - 4
        );
      });

      doc.rect(
        margin,
        y - 4,
        availableWidth,
        requiredHeight
      );

      y += requiredHeight;
    });

    if (headers.length > maxColumns) {
      if (y > pageHeight - 25) {
        doc.addPage();
        addHeader();
        y = 38;
      }

      y += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Note: PDF displays the first ${maxColumns} columns. Download CSV for the complete dataset.`,
        margin,
        y
      );
    }

    // Page numbers
    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);

      doc.text(
        `Page ${page} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 6,
        { align: 'right' }
      );
    }

    doc.save(`${reportType}_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleGenerateReport = (reportType, format = 'csv') => {
    const data = getReportData(reportType);

    // Check if there's data to export
    if (!data || data.length === 0) {
      alert(`No data available for ${reportType} report`);
      return;
    }

    try {
      if (format.toLowerCase() === 'pdf') {
        downloadPdfReport(reportType, data);

        alert(
          `${getReportTitle(reportType)} PDF downloaded successfully!`
        );

        return;
      }

      // CSV export
      const filename = `${reportType}_report_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      const headers = Object.keys(data[0] || {});

      const csvRows = [
        headers.map(escapeCsvValue).join(','),
        ...data.map((row) =>
          headers
            .map((header) => escapeCsvValue(row?.[header]))
            .join(',')
        )
      ];

      const csvString = csvRows.join('\n');

      // BOM helps Excel correctly detect UTF-8 content.
      const blob = new Blob(
        ['\uFEFF', csvString],
        { type: 'text/csv;charset=utf-8;' }
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = filename;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      alert(
        `${getReportTitle(reportType)} CSV downloaded successfully!`
      );
    } catch (error) {
      console.error(`Error generating ${format} report:`, error);
      alert(
        `Error generating ${format.toUpperCase()} report. Please try again.`
      );
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleGenerateReport('inventory', 'csv')}
                className="btn-primary w-full flex items-center justify-center space-x-2"
                disabled={!reports.inventory || reports.inventory.length === 0}
              >
                <FiDownload />
                <span>Download CSV</span>
              </button>

              <button
                onClick={() => handleGenerateReport('inventory', 'pdf')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!reports.inventory || reports.inventory.length === 0}
              >
                <FiFileText />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FiTrendingUp className="text-green-600" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Sales Report</h3>
            <p className="text-gray-600 mb-4">All invoices with status, payments, and totals</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleGenerateReport('sales', 'csv')}
                className="btn-primary w-full flex items-center justify-center space-x-2"
                disabled={!reports.sales || reports.sales.length === 0}
              >
                <FiDownload />
                <span>Download CSV</span>
              </button>

              <button
                onClick={() => handleGenerateReport('sales', 'pdf')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!reports.sales || reports.sales.length === 0}
              >
                <FiFileText />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <FiUsers className="text-purple-600" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Outlet Report</h3>
            <p className="text-gray-600 mb-4">Complete outlet list with credit limits and status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleGenerateReport('outlets', 'csv')}
                className="btn-primary w-full flex items-center justify-center space-x-2"
                disabled={!reports.outlets || reports.outlets.length === 0}
              >
                <FiDownload />
                <span>Download CSV</span>
              </button>

              <button
                onClick={() => handleGenerateReport('outlets', 'pdf')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!reports.outlets || reports.outlets.length === 0}
              >
                <FiFileText />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FiDollarSign className="text-red-600" size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Credit Report</h3>
            <p className="text-gray-600 mb-4">Outstanding credits and payment tracking</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleGenerateReport('credit', 'csv')}
                className="btn-primary w-full flex items-center justify-center space-x-2"
                disabled={!reports.credit || reports.credit.length === 0}
              >
                <FiDownload />
                <span>Download CSV</span>
              </button>

              <button
                onClick={() => handleGenerateReport('credit', 'pdf')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!reports.credit || reports.credit.length === 0}
              >
                <FiFileText />
                <span>Download PDF</span>
              </button>
            </div>
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