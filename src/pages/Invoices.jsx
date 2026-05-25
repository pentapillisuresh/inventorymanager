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
    // showSuccessPopup(distributionData);

  };

  const showSuccessPopup = (distributionData) => {
    console.log('rrr:::', distributionData);
  
    // Group products by boxName
    const groupedBoxes = distributionData.products.reduce((acc, product) => {
      if (!acc[product.boxName]) {
        acc[product.boxName] = {
          products: [],
          total: 0
        };
      }
  
      acc[product.boxName].products.push(product);
      acc[product.boxName].total += product.total;
  
      return acc;
    }, {});
  
    // Create popup
    const popupDiv = document.createElement('div');
    popupDiv.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]';
  
    popupDiv.innerHTML = `
      <div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 class="text-2xl font-bold text-green-600">
            ✓ Distribution Created Successfully!
          </h2>
  
          <button class="close-popup text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>
  
        <div class="p-6">
  
          <!-- Invoice Summary -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Invoice Number</p>
                <p class="text-2xl font-bold text-blue-800">
                  ${distributionData.invoice}
                </p>
              </div>
  
              <div class="text-right">
                <p class="text-sm text-gray-600">Total Amount</p>
                <p class="text-2xl font-bold text-green-600">
                  $${distributionData.totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
  
          <!-- Distribution Details -->
          <div class="mb-6">
            <h3 class="font-semibold text-gray-800 mb-3">
              Distribution Details
            </h3>
  
            <div class="grid grid-cols-2 gap-4 text-sm">
  
              <div>
                <p class="text-gray-600">Type:</p>
                <p class="font-medium capitalize">
                  ${distributionData.mode} Distribution
                </p>
              </div>
  
              <div>
                <p class="text-gray-600">Payment Type:</p>
                <p class="font-medium">
                  ${distributionData.paymentType}
                </p>
              </div>
  
              <div>
                <p class="text-gray-600">Paid Amount:</p>
                <p class="font-medium text-green-600">
                  $${distributionData.paidAmount.toFixed(2)}
                </p>
              </div>
  
              ${
                distributionData.creditAmount > 0
                  ? `
                  <div>
                    <p class="text-gray-600">Credit Amount:</p>
                    <p class="font-medium text-blue-600">
                      $${distributionData.creditAmount.toFixed(2)}
                    </p>
                  </div>
                `
                  : ''
              }
  
              ${
                distributionData.discount > 0
                  ? `
                  <div>
                    <p class="text-gray-600">Discount:</p>
                    <p class="font-medium text-orange-600">
                      ${distributionData.discount}%
                    </p>
                  </div>
                `
                  : ''
              }
            </div>
          </div>
  
          <!-- All Products Table -->
          <div class="mb-8">
            <h3 class="font-semibold text-gray-800 mb-3">
              Products Distributed
            </h3>
  
            <div class="overflow-x-auto border rounded-lg">
              <table class="w-full text-sm">
                
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left">Product</th>
                    <th class="px-3 py-2 text-center">Qty</th>
                    <th class="px-3 py-2 text-right">Price</th>
                    <th class="px-3 py-2 text-left">Box</th>
                    <th class="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
  
                <tbody>
                  ${distributionData.products
                    .map(
                      (product) => `
                      <tr class="border-t border-gray-200">
                        <td class="px-3 py-2">
                          ${product.productName}
                        </td>
  
                        <td class="px-3 py-2 text-center">
                          ${product.quantity}
                        </td>
  
                        <td class="px-3 py-2 text-right">
                          $${product.price.toFixed(2)}
                        </td>
  
                        <td class="px-3 py-2">
                          ${product.boxName}
                        </td>
  
                        <td class="px-3 py-2 text-right">
                          $${product.total.toFixed(2)}
                        </td>
                      </tr>
                    `
                    )
                    .join('')}
                </tbody>
  
                <tfoot class="bg-gray-50">
                  <tr>
                    <td colspan="4" class="px-3 py-2 text-right font-semibold">
                      Grand Total:
                    </td>
  
                    <td class="px-3 py-2 text-right font-bold text-green-700">
                      $${distributionData.totalValue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
  
              </table>
            </div>
          </div>
  
          <!-- BOXES SECTION -->
          <div class="mb-6">
            <h3 class="font-bold text-xl text-gray-800 mb-4">
              Box Wise Distribution
            </h3>
  
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  
              ${Object.entries(groupedBoxes)
                .map(
                  ([boxName, boxData]) => `
                
                <div class="border border-gray-300 rounded-xl shadow-sm overflow-hidden">
  
                  <!-- Box Header -->
                  <div class="bg-indigo-600 text-white px-4 py-3">
                    <div class="flex justify-between items-center">
                      <h4 class="font-semibold text-lg">
                        ${boxName}
                      </h4>
  
                      <span class="bg-white text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">
                        ${boxData.products.length} Item(s)
                      </span>
                    </div>
                  </div>
  
                  <!-- Products -->
                  <div class="p-4">
  
                    <table class="w-full text-sm">
                      
                      <thead>
                        <tr class="border-b">
                          <th class="text-left py-2">Product</th>
                          <th class="text-center py-2">Qty</th>
                          <th class="text-right py-2">Price</th>
                          <th class="text-right py-2">Amount</th>
                        </tr>
                      </thead>
  
                      <tbody>
                        ${boxData.products
                          .map(
                            (product) => `
                            <tr class="border-b border-gray-100">
                              
                              <td class="py-2">
                                ${product.productName}
                              </td>
  
                              <td class="py-2 text-center">
                                ${product.quantity}
                              </td>
  
                              <td class="py-2 text-right">
                                $${product.price.toFixed(2)}
                              </td>
  
                              <td class="py-2 text-right font-medium">
                                $${product.total.toFixed(2)}
                              </td>
  
                            </tr>
                          `
                          )
                          .join('')}
                      </tbody>
  
                      <tfoot>
                        <tr>
                          <td colspan="3" class="pt-3 text-right font-bold text-gray-700">
                            Box Total:
                          </td>
  
                          <td class="pt-3 text-right font-bold text-green-700">
                            $${boxData.total.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
  
                    </table>
  
                  </div>
  
                </div>
  
              `
                )
                .join('')}
  
            </div>
          </div>
  
          ${
            distributionData.notes
              ? `
              <div class="mb-6">
                <h3 class="font-semibold text-gray-800 mb-2">
                  Notes
                </h3>
  
                <p class="text-gray-600 text-sm">
                  ${distributionData.notes}
                </p>
              </div>
            `
              : ''
          }
  
          <!-- Footer -->
          <div class="flex justify-end">
            <button class="close-popup bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Close
            </button>
          </div>
  
        </div>
      </div>
    `;
  
    document.body.appendChild(popupDiv);
  
    // Close handlers
    const closeButtons = popupDiv.querySelectorAll('.close-popup');
  
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        popupDiv.remove();
      });
    });
  
    // Outside click close
    popupDiv.addEventListener('click', (e) => {
      if (e.target === popupDiv) {
        popupDiv.remove();
      }
    });
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