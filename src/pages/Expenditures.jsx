import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import { FaSearch, FaFilter, FaPlus, FaEye, FaCheckCircle, FaTimesCircle, FaSpinner, FaTimes } from 'react-icons/fa';
import ApiService from '../utils/ApiService';
import { storage } from '../utils/storage';

const API_BASE_URL = 'http://localhost:5001/api';

const Expenditures = ({ onLogout }) => {
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    notes: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const clientToken = localStorage.getItem('token');
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingAmount: 0,
    pendingItems: 0,
    categoriesCount: 0
  });

  // State for categories from API
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchExpenditures();
    fetchCategories();
  }, []);

  // Fetch expenditures from API
  const fetchExpenditures = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get(`/expenditures`,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response) {
        throw new Error('Failed to fetch expenditures');
      }
      
      // Transform API data to match your component structure
      const transformedExpenditures = response.expenditures.map(exp => ({
        id: exp.id,
        date: new Date(exp.date).toISOString().split('T')[0],
        category: exp.category,
        description: exp.description,
        amount: parseFloat(exp.amount),
        notes: '', // API doesn't have notes field
        status: exp.verified ? 'Approved' : 'Pending',
        adminName: exp.Admin?.name,
        receiptImage: exp.receiptImage
      }));
      
      setExpenditures(transformedExpenditures);
      
      // Calculate statistics from API data
      const totalExpenses = response.summary.totalAmount;
      const pendingAmount = response.summary.pendingAmount;
      const pendingItems = transformedExpenditures.filter(e => e.status === 'Pending').length;
      
      setStats(prev => ({
        ...prev,
        totalExpenses,
        pendingAmount,
        pendingItems,
        totalItems: response.summary.total
      }));
    } catch (error) {
      console.error('Error fetching expenditures:', error);
      alert('Failed to load expenditures. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API (you might need a separate endpoint for this)
  const fetchCategories = async () => {
        setCategories(storage.getExpenseCategories);
  };

  // Handle adding a new expense via API
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const expenseData = {
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        date: new Date(newExpense.date).toISOString(), // Convert to ISO string
        // notes field is not in API model, so we're omitting it
      };

      const response = await ApiService.post(`/expenditures`,expenseData,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add expense');
      }      
      // Refresh the expenditures list
      await fetchExpenditures();
      
      // Add the new category to local categories list if it doesn't exist
      if (!categories.includes(newExpense.category)) {
        setCategories(prev => [...prev, newExpense.category]);
      }
      
      setShowAddModal(false);
      resetNewExpense();
      alert('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert(`Failed to add expense: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };


  const resetNewExpense = () => {
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: '',
      notes: ''
    });
  };

  const handleViewDetails = (expense) => {
    setShowDetails(expense);
  };

  const handleCloseDetails = () => {
    setShowDetails(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter expenditures based on search and filters
  const filteredExpenditures = expenditures.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <div className="flex-1 flex flex-col">
        
        <div className="flex-1 p-6">
          {/* Add Expense Modal - Fixed Alignment */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl">
                {/* Fixed Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetNewExpense();
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    disabled={saving}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <form onSubmit={handleSaveExpense}>
                    <div className="space-y-5">
                      {/* Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                        <input
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                          disabled={saving}
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                        <select
                          value={newExpense.category}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                          required
                          disabled={saving}
                        >
                          <option value="">Select category...</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                        <input
                          type="text"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter expense description..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                          disabled={saving}
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                            disabled={saving}
                          />
                        </div>
                      </div>

                      {/* Notes - Optional field not in API */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
                        <textarea
                          value={newExpense.notes}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                          rows="2"
                          placeholder="Add any additional notes..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                          disabled={saving}
                        />
                        <p className="text-xs text-gray-500 mt-1">Note: This field is for reference only and won't be saved to the server.</p>
                      </div>
                    </div>

                    {/* Form Actions - Sticky at bottom */}
                    <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 mt-6">
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            resetNewExpense();
                          }}
                          className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition"
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center min-w-[120px] transition"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" size={14} />
                              Adding...
                            </>
                          ) : (
                            'Add Expense'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Expense Details Modal - Fixed Alignment */}
          {showDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
                {/* Fixed Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
                  <button
                    onClick={handleCloseDetails}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                        <p className="text-base font-semibold text-gray-900">{showDetails.date}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                        <p className="text-base font-semibold text-gray-900">{showDetails.category}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <p className="text-base font-semibold text-gray-900">{showDetails.description}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                      <p className="text-2xl font-bold text-blue-700">${showDetails.amount.toFixed(2)}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(showDetails.status)}`}>
                        {showDetails.status}
                      </span>
                      {showDetails.adminName && (
                        <p className="text-xs text-gray-500 mt-2">Added by {showDetails.adminName}</p>
                      )}
                    </div>
                    
                    {showDetails.receiptImage && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Receipt</label>
                        <div className="mt-1">
                          <img 
                            src={`http://localhost:5001/${showDetails.receiptImage}`} 
                            alt="Receipt" 
                            className="w-full max-h-40 object-contain border border-gray-200 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                    
                    {showDetails.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                        <p className="text-sm text-gray-700">{showDetails.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 mt-4">
                    <button
                      onClick={handleCloseDetails}
                      className="w-full px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Track and manage business expenses</h1>
                <p className="text-gray-600 mt-1">Monitor all expenditures and approvals</p>
              </div>
              <div className="flex items-center space-x-2">
                {loading && (
                  <div className="flex items-center text-gray-500">
                    <FaSpinner className="animate-spin mr-2" />
                    Loading...
                  </div>
                )}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  <FaPlus />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
                <div className="text-3xl font-bold text-gray-800">${stats.totalExpenses.toFixed(2)}</div>
                <div className="text-sm text-gray-500 mt-2">All time total</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Pending Approval</div>
                <div className="text-3xl font-bold text-yellow-600">${stats.pendingAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-500 mt-2">{stats.pendingItems} items</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Categories</div>
                <div className="text-3xl font-bold text-green-600">{categories.length}</div>
                <div className="text-sm text-gray-500 mt-2">Active categories</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Total Items</div>
                <div className="text-3xl font-bold text-purple-600">{stats.totalItems || 0}</div>
                <div className="text-sm text-gray-500 mt-2">All expenses</div>
              </div>
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search expenses by description or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Recent Expenses Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRIPTION</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AMOUNT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADDED BY</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex justify-center items-center">
                            <FaSpinner className="animate-spin text-2xl text-blue-600 mr-3" />
                            <span className="text-gray-600">Loading expenses...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredExpenditures.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="text-gray-400 mb-2">No expenses found</div>
                          <div className="text-gray-500 text-sm">
                            {searchTerm || categoryFilter !== 'All' || statusFilter !== 'All'
                              ? 'Try adjusting your search or filters' 
                              : 'Add your first expense using the button above'}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredExpenditures.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{expense.date}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{expense.category}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{expense.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">${expense.amount.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                              {expense.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{expense.adminName || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(expense)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FaEye className="inline-block mr-1" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenditures;