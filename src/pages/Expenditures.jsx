import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import {FaSearch,FaFilter,FaPlus,FaEye,FaCheckCircle,FaTimesCircle,FaSpinner,FaTimes,FaEdit,FaTrash,FaUpload} from 'react-icons/fa';
import ApiService from '../utils/ApiService';
import { storage } from '../utils/storage';

// const API_BASE_URL = 'http://localhost:5001/api';
const API_BASE_URL = 'https://service.billmitras.com/api';

const Expenditures = ({ onLogout }) => {
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // null = add mode
  const [showDetails, setShowDetails] = useState(null);

  // Form state
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const fileInputRef = useRef(null);
  const clientToken = localStorage.getItem('token');

  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingAmount: 0,
    pendingItems: 0,
    categoriesCount: 0,
    totalItems: 0
  });

  const [categories, setCategories] = useState([]);

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    fetchExpenditures();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /* API                                                                */
  /* ------------------------------------------------------------------ */
  const fetchExpenditures = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get(`/expenditures`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response) throw new Error('Failed to fetch expenditures');

      const transformedExpenditures = (response.expenditures || []).map((exp) => ({
        id: exp.id,
        date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '',
        category: exp.category,
        description: exp.description,
        amount: parseFloat(exp.amount || 0),
        status: exp.verified ? 'Approved' : 'Pending',
        adminName: exp.Admin?.name,
        receiptImage: exp.receiptImage
      }));

      setExpenditures(transformedExpenditures);

      const totalExpenses = response.summary?.totalAmount ?? 0;
      const pendingAmount = response.summary?.pendingAmount ?? 0;
      const pendingItems = transformedExpenditures.filter((e) => e.status === 'Pending').length;

      setStats((prev) => ({
        ...prev,
        totalExpenses,
        pendingAmount,
        pendingItems,
        totalItems: response.summary?.total ?? transformedExpenditures.length
      }));
    } catch (error) {
      console.error('Error fetching expenditures:', error);
      alert('Failed to load expenditures. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // storage.getExpenseCategories may be a function or array — handle both
      const cats =
        typeof storage.getExpenseCategories === 'function'
          ? storage.getExpenseCategories()
          : storage.getExpenseCategories;
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Form helpers                                                       */
  /* ------------------------------------------------------------------ */
  const resetForm = () => {
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: ''
    });
    setReceiptFile(null);
    setReceiptPreview(null);
    setEditingExpense(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount
    });
    setReceiptFile(null);
    setReceiptPreview(
      // expense.receiptImage ? `http://localhost:5001/${expense.receiptImage}` : null
      expense.receiptImage ? `https://service.billmitras.com/${expense.receiptImage}` : null
    );
    setShowAddModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowAddModal(false);
    resetForm();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Receipt image must be less than 5 MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ------------------------------------------------------------------ */
  /* Save (Add or Edit)                                                 */
  /* ------------------------------------------------------------------ */
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Build FormData because backend uses upload.single('receiptImage')
      const formData = new FormData();
      formData.append('category', newExpense.category);
      formData.append('description', newExpense.description);
      formData.append('amount', newExpense.amount);
      formData.append('date', new Date(newExpense.date).toISOString());
      if (receiptFile) {
        formData.append('receiptImage', receiptFile);
      }

      const isEdit = !!editingExpense;
      const url = isEdit ? `/expenditures/${editingExpense.id}` : `/expenditures`;

      // For FormData, let the browser set Content-Type (multipart/form-data with boundary)
      const response = await (isEdit
        ? ApiService.put(url, formData, {
            headers: { Authorization: `Bearer ${clientToken}` }
          })
        : ApiService.post(url, formData, {
            headers: { Authorization: `Bearer ${clientToken}` }
          }));

      if (!response) throw new Error('Request failed');

      // Add new category locally if needed
      if (!categories.includes(newExpense.category)) {
        setCategories((prev) => [...prev, newExpense.category]);
      }

      await fetchExpenditures();
      alert(isEdit ? 'Expense updated successfully!' : 'Expense added successfully!');
      closeModal();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert(`Failed to ${editingExpense ? 'update' : 'add'} expense: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Delete                                                             */
  /* ------------------------------------------------------------------ */
  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete expense "${expense.description}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(expense.id);
    try {
      await ApiService.delete(`/expenditures/${expense.id}`, {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        }
      });

      setExpenditures((prev) => prev.filter((e) => e.id !== expense.id));
      alert('Expense deleted successfully!');
      await fetchExpenditures();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Details                                                            */
  /* ------------------------------------------------------------------ */
  const handleViewDetails = (expense) => setShowDetails(expense);
  const handleCloseDetails = () => setShowDetails(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /* ------------------------------------------------------------------ */
  /* Filtering                                                          */
  /* ------------------------------------------------------------------ */
  const filteredExpenditures = expenditures.filter((expense) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      expense.description.toLowerCase().includes(term) ||
      expense.category.toLowerCase().includes(term);
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6">

          {/* ============ ADD / EDIT EXPENSE MODAL ============ */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    disabled={saving}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <form onSubmit={handleSaveExpense}>
                    <div className="space-y-5">
                      {/* Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                        <input
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense((p) => ({ ...p, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={saving}
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                        <select
                          value={newExpense.category}
                          onChange={(e) => setNewExpense((p) => ({ ...p, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          required
                          disabled={saving}
                        >
                          <option value="">Select category...</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                        <input
                          type="text"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Enter expense description..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={saving}
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={saving}
                          />
                        </div>
                      </div>

                      {/* Receipt Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Receipt Image {editingExpense ? '(leave empty to keep current)' : '(optional)'}
                        </label>

                        {!receiptPreview ? (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                            <FaUpload className="text-gray-400 mb-2" size={22} />
                            <span className="text-sm text-gray-600">Click to upload receipt</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5 MB</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                              disabled={saving}
                            />
                          </label>
                        ) : (
                          <div className="relative border border-gray-200 rounded-lg p-2">
                            <img
                              src={receiptPreview}
                              alt="Receipt preview"
                              className="w-full max-h-48 object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={removeReceipt}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow"
                              disabled={saving}
                              title="Remove receipt"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 mt-6">
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center min-w-[130px]"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" size={14} />
                              {editingExpense ? 'Updating...' : 'Adding...'}
                            </>
                          ) : (
                            editingExpense ? 'Update Expense' : 'Add Expense'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ============ DETAILS MODAL ============ */}
          {showDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
                  <button
                    onClick={handleCloseDetails}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

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
                      <p className="text-2xl font-bold text-blue-700">
                        ₹{Number(showDetails.amount || 0).toFixed(2)}
                      </p>
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
                        <img
                          src={`http://localhost:5001/${showDetails.receiptImage}`}
                          alt="Receipt"
                          className="w-full max-h-40 object-contain border border-gray-200 rounded-lg mt-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 mt-4">
                    <button
                      onClick={handleCloseDetails}
                      className="w-full px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ MAIN CONTENT ============ */}
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
                  onClick={openAddModal}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  <FaPlus />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
                <div className="text-3xl font-bold text-gray-800">
                  ₹{Number(stats.totalExpenses || 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-2">All time total</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Pending Approval</div>
                <div className="text-3xl font-bold text-yellow-600">
                  ₹{Number(stats.pendingAmount || 0).toFixed(2)}
                </div>
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
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.category}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{Number(expense.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                              {expense.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.adminName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleViewDetails(expense)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => openEditModal(expense)}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(expense)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete"
                                disabled={deletingId === expense.id}
                              >
                                {deletingId === expense.id ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaTrash />
                                )}
                              </button>
                            </div>
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