// src/pages/Invoices.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import InvoiceList from '../components/Invoices/InvoiceList';
import CreateInvoice from '../components/Invoices/CreateInvoice';
import { FiFileText, FiPlus, FiList, FiFile, FiDownload, FiEye } from 'react-icons/fi';
import { FaBox, FaTruck, FaFilePdf, FaSpinner, FaChevronRight, FaDownload, FaPrint } from 'react-icons/fa';
import ApiService from '../utils/ApiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Invoices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [waybills, setWaybills] = useState([]);
  const [waybillLoading, setWaybillLoading] = useState(false);
  const [openBatch, setOpenBatch] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });

  const clientToken = localStorage.getItem('token');
  const storeId = localStorage.getItem('storeId');

  // Get current active tab based on URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/create')) return 'create';
    if (path.includes('/waybills')) return 'waybills';
    return 'list';
  };

  const activeTab = getActiveTab();

  // Fetch store invoices
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

  // Fetch waybills
  const fetchWaybills = async () => {
    setWaybillLoading(true);
    try {
      const storeId = localStorage.getItem('storeId');
      if (!storeId) {
        console.warn('No store ID found');
        setWaybills([]);
        return;
      }

      const response = await ApiService.get(`/stores/${storeId}/waybills`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.waybills) {
        setWaybills(response.waybills);
      }
    } catch (error) {
      console.error('Error fetching waybills:', error);
      setWaybills([]);
    } finally {
      setWaybillLoading(false);
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
    if (activeTab === 'waybills') {
      fetchWaybills();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'waybills') {
      fetchWaybills();
    }
  }, [activeTab]);

  // Group waybills by batchId
  const batchArray = Object.entries(
    waybills.reduce((acc, item) => {
      if (!acc[item.batchId]) {
        acc[item.batchId] = [];
      }
      acc[item.batchId].push(item);
      return acc;
    }, {})
  ).map(([batchId, items]) => ({
    batchId,
    items,
    totalAmount: items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    invoice: items[0]?.invoice || null, // Add invoice data from the first item in the batch
    invoiceId: items[0]?.invoiceId, // Add invoice ID
    invoiceNumber: items[0]?.invoice?.invoiceNumber, // Add invoice number
    invoiceType: items[0]?.invoice?.type, // Add invoice type (distribution/outlet_sale)
    totalBoxes: [...new Set(items.map(item => item.boxName))].length,
    totalProducts: items.length,
    createdAt: items[0]?.createdAt || new Date().toISOString()

  }));

  // Filter waybills by search term
  const filteredBatches = batchArray.filter(batch =>
    batch.batchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Download Waybill PDF
  const downloadWaybillPDF = async (batchId, batchItems, batchTotal, batchInvoice) => {
    setIsDownloading(true);
    
    // Create a temporary div for PDF rendering
    const pdfContent = document.createElement('div');
    pdfContent.style.padding = '40px';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.maxWidth = '1000px';
    pdfContent.style.margin = '0 auto';
    
    // Determine From and To addresses based on invoice type
    const isDistribution = batchInvoice?.type === 'distribution';
    
    // From address (createdBy data - from batchInvoice.createdUser)
    const fromAddress = {
      name: batchInvoice?.createdUser?.name || 'N/A',
      address: batchInvoice?.createdUser?.officeAddress || 'N/A',
      phone: batchInvoice?.createdUser?.phoneNumber || 'N/A',
      email: batchInvoice?.createdUser?.email || 'N/A'
    };
    
    // To address (Store for distribution, Outlet for outlet_sale)
    let toAddress = {};
    if (isDistribution) {
      toAddress = {
        name: batchInvoice?.Store?.name || 'N/A',
        address: batchInvoice?.Store?.address || 'N/A',
        phone: batchInvoice?.Store?.phoneNumber || 'N/A'
      };
    } else {
      toAddress = {
        name: batchInvoice?.Outlet?.name || 'N/A',
        address: batchInvoice?.Outlet?.address || 'N/A',
        phone: batchInvoice?.Outlet?.phoneNumber || 'N/A'
      };
    }
    
    // Calculate box groupings
    const boxesInBatch = batchItems.reduce((acc, item) => {
      if (!acc[item.boxName]) {
        acc[item.boxName] = {
          items: [],
          total: 0
        };
      }
      acc[item.boxName].items.push(item);
      acc[item.boxName].total += Number(item.totalPrice || 0);
      return acc;
    }, {});
    
    // Build HTML content with exact invoice format
    pdfContent.innerHTML = `
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="text-align: center; color: #1e40af; margin: 0; font-size: 32px; font-weight: bold; text-transform: uppercase;">
          ${isDistribution ? 'DISTRIBUTION' : 'OUTLET SALE'} WAYBILL
        </h1>
        <p style="text-align: center; color: #6b7280; margin-top: 8px; font-size: 14px;">
          ${batchInvoice?.invoiceNumber || 'Invoice Number'} | ${new Date(batchInvoice?.createdAt).toLocaleDateString() || ''}
        </p>
      </div>
  
      <!-- From and To Address Section -->
      <div style="margin-bottom: 25px; display: flex; justify-content: space-between; gap: 20px;">
        <!-- From Address -->
        <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">📤 FROM</h3>
          <p style="margin: 5px 0; font-weight: 600;">${fromAddress.name}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">${fromAddress.address}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">Phone: ${fromAddress.phone}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">Email: ${fromAddress.email}</p>
        </div>
        
        <!-- To Address -->
        <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">📥 TO</h3>
          <p style="margin: 5px 0; font-weight: 600;">${toAddress.name}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">${toAddress.address}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #4b5563;">Phone: ${toAddress.phone}</p>
        </div>
      </div>
  
      <!-- Batch Information -->
      <div style="margin-bottom: 25px; background: #f3f4f6; padding: 15px; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px; width: 33%;"><strong>Batch ID:</strong> ${batchId}</td>
            <td style="padding: 5px; width: 33%;"><strong>Invoice No:</strong> ${batchInvoice?.invoiceNumber || 'N/A'}</td>
            <td style="padding: 5px; width: 33%;"><strong>Total Amount:</strong> ₹${batchTotal.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 5px;"><strong>Date:</strong> ${new Date(batchInvoice?.createdAt || new Date()).toLocaleString()}</td>
            <td style="padding: 5px;"><strong>Type:</strong> ${isDistribution ? 'Distribution' : 'Outlet Sale'}</td>
            <td style="padding: 5px;"></td>
          </tr>
        </table>
      </div>
  
      ${Object.entries(boxesInBatch).map(([boxName, boxData], boxIndex) => `
        <!-- Box ${boxIndex + 1} -->
        <div style="margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 12px 15px; border-bottom: 2px solid #e2e8f0;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">📦 BOX: ${boxName}</h3>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">SL NO</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">PRODUCT NAME</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600;">HSN CODE</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600;">QTY</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">RATE (₹)</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">AMOUNT (₹)</th>
               </tr>
            </thead>
            <tbody>
              ${boxData.items.map((item, idx) => `
                <tr>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${idx + 1}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${item.Product?.name || 'N/A'}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${item.Product?.HSN_No || 'N/A'}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right;">${parseFloat(item.price || 0).toLocaleString('en-IN')}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 500;">${parseFloat(item.totalPrice || 0).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc;">
                <td colspan="5" style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #e2e8f0;">BOX TOTAL:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; border: 1px solid #e2e8f0;">₹${boxData.total.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `).join('')}
  
      <!-- Summary Section -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <div style="width: 350px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
            <span style="font-weight: 600;">Total Gross Amount</span>
            <span>₹${batchTotal.toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 600;">Add CGST (9%)</span>
            <span>₹${(batchTotal * 0.09).toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 600;">Add SGST (9%)</span>
            <span>₹${(batchTotal * 0.09).toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 15px; background: #f0fdf4; font-weight: bold; font-size: 16px;">
            <span>GRAND TOTAL</span>
            <span>₹${(batchTotal * 1.18).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
  
      <!-- Payment Details -->
      <div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 8px;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">PAYMENT DETAILS</h4>
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td style="padding: 5px; width: 33%;"><strong>Payment Method:</strong> ${batchItems[0]?.paymentMethod || 'Paid'}</td>
            <td style="padding: 5px; width: 33%;"><strong>Paid Amount:</strong> ₹${(batchTotal * 0.5).toLocaleString('en-IN')}</td>
            <td style="padding: 5px; width: 33%;"><strong>Credit Amount:</strong> ₹${(batchTotal * 0.5).toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>
  
      <!-- Signature Section -->
      <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div style="width: 45%;">
          <p style="font-weight: 600; margin-bottom: 40px;">Receiver's Signature</p>
          <div style="border-bottom: 1px solid #000; width: 80%;"></div>
          <p style="margin-top: 5px; font-size: 11px; color: #6b7280;">Name: ${toAddress.name || '___________________'}</p>
          <p style="margin-top: 5px; font-size: 11px; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="width: 45%; text-align: right;">
          <p style="font-weight: 600; margin-bottom: 40px;">Authorized Signature</p>
          <div style="border-bottom: 1px solid #000; width: 80%; margin-left: auto;"></div>
          <p style="margin-top: 5px; font-size: 11px; color: #6b7280;">Name: ${fromAddress.name || '___________________'}</p>
          <p style="margin-top: 5px; font-size: 11px; color: #6b7280;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
  
      <!-- Footer -->
      <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 10px; color: #9ca3af;">
        <p>This is a computer-generated waybill. Valid without signature.</p>
        <p>${fromAddress.name} - ${fromAddress.address} | Phone: ${fromAddress.phone}</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    `;
    
    document.body.appendChild(pdfContent);
    
    try {
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Waybill_${batchId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      document.body.removeChild(pdfContent);
      setIsDownloading(false);
    }
  };
  
  const handleViewInvoice = (invoice) => {
    console.log('View invoice:', invoice);
  };

  // Three Tabs
  const tabs = [
    { id: 'list', label: 'All Invoices', icon: FiList, path: '/invoices', badge: invoices.length },
    { id: 'create', label: 'Create Invoice', icon: FiPlus, path: '/invoices/create', badge: null },
    { id: 'waybills', label: 'Waybills', icon: FaFilePdf, path: '/invoices/waybills', badge: batchArray.length }
  ];

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  if (loading && invoices.length === 0 && activeTab === 'list') {
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
        <p className="text-gray-600">Create and manage invoices & waybills</p>
      </div>

      {/* Three Tabs */}
      <div className="border-b">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center space-x-2 px-4 py-3 font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && tab.badge > 0 && (
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar - Only show for list and waybills tabs */}
      {activeTab !== 'create' && (
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder={activeTab === 'list' ? "Search invoices..." : "Search waybills by Batch ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}

      {/* ALL INVOICES TAB */}
      {activeTab === 'list' && (
        <InvoiceList 
          invoices={invoices}
          pagination={pagination}
          onPageChange={fetchInvoicesData}
          onView={handleViewInvoice} 
          loading={loading}
        />
      )}

      {/* CREATE INVOICE TAB */}
      {activeTab === 'create' && (
        <CreateInvoice />
      )}

      {/* WAYBILLS TAB */}
      {activeTab === 'waybills' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {waybillLoading ? (
            <div className="flex justify-center items-center py-12">
              <FaSpinner className="animate-spin text-3xl text-primary-600" />
            </div>
          ) : filteredBatches.length > 0 ? (
            <div className="p-6 space-y-5">
              {/* Waybill Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                  <p className="text-sm text-blue-700 font-medium">Total Batches</p>
                  <p className="text-2xl font-bold text-gray-800">{filteredBatches.length}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                  <p className="text-sm text-purple-700 font-medium">Total Boxes</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {filteredBatches.reduce((sum, b) => sum + b.totalBoxes, 0)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl">
                  <p className="text-sm text-emerald-700 font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {filteredBatches.reduce((sum, b) => sum + b.totalProducts, 0)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl">
                  <p className="text-sm text-amber-700 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(filteredBatches.reduce((sum, b) => sum + b.totalAmount, 0))}
                  </p>
                </div>
              </div>

              {/* Waybill List */}
              <div className="space-y-5">
                {filteredBatches.map((batch) => {
                  const isOpen = openBatch === batch.batchId;
                  const boxesInBatch = batch.items.reduce((acc, item) => {
                    if (!acc[item.boxName]) {
                      acc[item.boxName] = { items: [], total: 0 };
                    }
                    acc[item.boxName].items.push(item);
                    acc[item.boxName].total += Number(item.totalPrice || 0);
                    return acc;
                  }, {});

                  return (
                    <div key={batch.batchId} className="border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                      {/* Batch Header */}
                      <button
                        onClick={() => setOpenBatch(isOpen ? null : batch.batchId)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all p-5 text-white"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                              <FaChevronRight className="text-white" size={16} />
                            </div>
                            <div className="text-left">
                              <p className="text-xs uppercase tracking-wider opacity-80">Batch ID</p>
                              <h3 className="text-xl font-bold">{batch.batchId}</h3>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-6">
                            <div className="text-right">
                              <p className="text-xs opacity-80">Total Boxes</p>
                              <p className="text-lg font-semibold">{batch.totalBoxes}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs opacity-80">Total Products</p>
                              <p className="text-lg font-semibold">{batch.totalProducts}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs opacity-80">Total Amount</p>
                              <p className="text-xl font-bold">{formatCurrency(batch.totalAmount)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs opacity-80">Date</p>
                              <p className="text-sm font-semibold">{new Date(batch.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expandable Content */}
                      {isOpen && (
                        <div className="p-5 bg-white">
                          {/* Download Button */}
                          <div className="flex justify-end mb-4">
                            <button  
                              onClick={() => downloadWaybillPDF(batch.batchId, batch.items, batch.totalAmount,batch.invoice)}
                              disabled={isDownloading}
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 shadow-sm"
                            >
                              {isDownloading ? <FaSpinner className="animate-spin" size={14} /> : <FaDownload size={14} />}
                              <span>Download Waybill PDF</span>
                            </button>
                          </div>

                          {/* Boxes Section */}
                          <div className="space-y-4">
                            {Object.entries(boxesInBatch).map(([boxName, boxData]) => (
                              <div key={boxName} className="bg-gradient-to-r from-blue-50/30 to-purple-50/30 rounded-xl p-4 border border-blue-100">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-blue-200">
                                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <FaBox className="text-blue-600" size={16} />
                                    Box: {boxName}
                                  </h4>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-800">{formatCurrency(boxData.total)}</p>
                                    <p className="text-xs text-gray-500">Box Total</p>
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">HSN No.</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Quantity</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price/Unit</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                      {boxData.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.Product?.name || 'N/A'}</td>
                                          <td className="px-3 py-2 text-sm text-gray-500">{item.Product?.HSN_No || 'N/A'}</td>
                                          <td className="px-3 py-2 text-sm text-center text-gray-700">{item.quantity}</td>
                                          <td className="px-3 py-2 text-sm text-right text-gray-700">{formatCurrency(item.price || 0)}</td>
                                          <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">{formatCurrency(item.totalPrice || 0)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td colSpan="4" className="px-3 py-2 text-right font-semibold text-gray-800">Box Total:</td>
                                        <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(boxData.total)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaFilePdf className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Waybills Found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No matching waybills available' : 'No waybills generated yet'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Invoices;