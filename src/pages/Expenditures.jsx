import React, { useEffect, useRef, useState } from 'react';
import {
  FaSearch, FaPlus, FaEye, FaSpinner, FaTimes, FaEdit, FaTrash,
  FaUpload, FaFilePdf, FaMinusCircle
} from 'react-icons/fa';
import ApiService from '../utils/ApiService';
import { storage } from '../utils/storage';
import jsPDF from 'jspdf';

const API_BASE_URL = 'https://service.billmitras.com/api';
const ITEMS_PER_PAGE = 20;
const EXPENSE_GROUP_STORAGE_KEY = 'billmitras_expense_group_map';

const getExpenseGroupMap = () => {
  try {
    const saved = localStorage.getItem(EXPENSE_GROUP_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Error reading expense group map:', error);
    return {};
  }
};

const saveExpenseGroupMap = (map) => {
  try {
    localStorage.setItem(EXPENSE_GROUP_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.error('Error saving expense group map:', error);
  }
};

const getCreatedExpenseId = (response) => (
  response?.id ?? response?.expenditure?.id ?? response?.expense?.id ??
  response?.data?.id ?? response?.data?.expenditure?.id ?? response?.data?.expense?.id ?? null
);

const Expenditures = ({ onLogout }) => {
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDetails, setShowDetails] = useState(null);

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '', description: '', amount: ''
  });
  const [expenseItems, setExpenseItems] = useState([
    { category: '', description: '', amount: '' }
  ]);

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const fileInputRef = useRef(null);
  const clientToken = localStorage.getItem('token');

  const [stats, setStats] = useState({
    totalExpenses: 0, pendingAmount: 0, pendingItems: 0,
    categoriesCount: 0, totalItems: 0
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchExpenditures();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  const fetchExpenditures = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get('/expenditures/getByUser', {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response) throw new Error('Failed to fetch expenditures');

      const storedGroupMap = getExpenseGroupMap();

      const records = (response.expenditures || []).map((exp) => ({
        id: exp.id,
        groupId: storedGroupMap[String(exp.id)] || null,
        date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '',
        category: exp.category || '',
        description: exp.description || '',
        amount: Number.parseFloat(exp.amount || 0),
        status: exp.verified ? 'Approved' : 'Pending',
        adminName: exp.Admin?.name || '',
        receiptImage: exp.receiptImage || null
      }));

      setExpenditures(records);

      const totalExpenses = response.summary?.totalAmount ?? records.reduce((s, e) => s + e.amount, 0);
      const pendingAmount = response.summary?.pendingAmount ?? records.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0);
      const pendingItems = records.filter(e => e.status === 'Pending').length;

      setStats(prev => ({
        ...prev,
        totalExpenses,
        pendingAmount,
        pendingItems,
        totalItems: response.summary?.total ?? records.length
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
      const cats = typeof storage.getExpenseCategories === 'function'
        ? storage.getExpenseCategories()
        : storage.getExpenseCategories;
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const resetForm = () => {
    setNewExpense({ date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '' });
    setExpenseItems([{ category: '', description: '', amount: '' }]);
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
    const items = expense.items?.length ? expense.items : [expense];
    const firstItem = items[0];

    // Keep the complete group while editing so every originally added item is editable.
    setEditingExpense({
      ...expense,
      items,
      groupId: expense.groupId || items.find(item => item.groupId)?.groupId || null
    });

    setNewExpense({
      date: expense.date || firstItem.date || '',
      category: firstItem.category || '',
      description: firstItem.description || '',
      amount: firstItem.amount ?? ''
    });

    setExpenseItems(
      items.map(item => ({
        id: item.id,
        category: item.category || '',
        description: item.description || '',
        amount: item.amount ?? '',
        receiptImage: item.receiptImage || null
      }))
    );

    setReceiptFile(null);
    setReceiptPreview(
      expense.receiptImage
        ? `${API_BASE_URL.replace('/api', '')}/${expense.receiptImage}`
        : firstItem.receiptImage
          ? `${API_BASE_URL.replace('/api', '')}/${firstItem.receiptImage}`
          : null
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
    if (file.size > 5 * 1024 * 1024) {
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

  const updateExpenseItem = (index, field, value) => {
    setExpenseItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addExpenseItem = () => {
    setExpenseItems(prev => [...prev, { category: '', description: '', amount: '' }]);
  };

  const removeExpenseItem = (index) => {
    setExpenseItems(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingExpense) {
        const validItems = expenseItems.filter(item =>
          item.category.trim() && item.description.trim() && Number(item.amount) > 0
        );

        if (validItems.length !== expenseItems.length) {
          alert('Please complete category, description and amount for every expense row.');
          return;
        }

        if (!validItems.length) {
          alert('Please keep at least one expense item.');
          return;
        }

        const originalItems = editingExpense.items || [];
        const currentIds = validItems.filter(item => item.id).map(item => item.id);
        const removedItems = originalItems.filter(item => !currentIds.includes(item.id));
        const addedCategories = [];
        let receiptAttached = false;

        // Update existing items and create newly-added items.
        for (const item of validItems) {
          const formData = new FormData();
          formData.append('category', item.category.trim());
          formData.append('description', item.description.trim());
          formData.append('amount', item.amount);
          formData.append('date', new Date(newExpense.date).toISOString());

          if (receiptFile && !receiptAttached) {
            formData.append('receiptImage', receiptFile);
            receiptAttached = true;
          }

          const response = item.id
            ? await ApiService.put(`/expenditures/${item.id}`, formData, {
                headers: { Authorization: `Bearer ${clientToken}` }
              })
            : await ApiService.post('/expenditures', formData, {
                headers: { Authorization: `Bearer ${clientToken}` }
              });

          if (!response) {
            throw new Error(`Failed to save expense: ${item.description}`);
          }

          const savedExpenseId = item.id || getCreatedExpenseId(response);
          if (!savedExpenseId) {
            throw new Error(`The API did not return an expense ID for: ${item.description}`);
          }

          const editGroupId = editingExpense.groupId || `expense-group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          const existingGroupMap = getExpenseGroupMap();
          existingGroupMap[String(savedExpenseId)] = editGroupId;
          saveExpenseGroupMap(existingGroupMap);

          if (!categories.includes(item.category) && !addedCategories.includes(item.category)) {
            addedCategories.push(item.category);
          }
        }

        // Items removed from the Edit modal are removed from the backend too.
        for (const item of removedItems) {
          await ApiService.delete(`/expenditures/${item.id}`, {
            headers: {
              Authorization: `Bearer ${clientToken}`,
              'Content-Type': 'application/json'
            }
          });
          const existingGroupMap = getExpenseGroupMap();
          delete existingGroupMap[String(item.id)];
          saveExpenseGroupMap(existingGroupMap);
        }

        if (addedCategories.length) {
          setCategories(prev => [...new Set([...prev, ...addedCategories])]);
        }

        await fetchExpenditures();
        alert('Expense group updated successfully!');
        closeModal();
        return;
      }

      const validItems = expenseItems.filter(item =>
        item.category.trim() && item.description.trim() && Number(item.amount) > 0
      );
      if (validItems.length !== expenseItems.length) {
        alert('Please complete category, description and amount for every expense row.');
        return;
      }
      if (!validItems.length) {
        alert('Please add at least one expense.');
        return;
      }

      const addedCategories = [];
      let firstItem = true;

      // One Add Expense click = one group. Category does not matter.
      // The next Add Expense click always gets a new group.
      const batchGroupId = `expense-group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const groupMap = getExpenseGroupMap();

      for (const item of validItems) {
        const formData = new FormData();
        formData.append('category', item.category.trim());
        formData.append('description', item.description.trim());
        formData.append('amount', item.amount);
        formData.append('date', new Date(newExpense.date).toISOString());
        if (receiptFile && firstItem) formData.append('receiptImage', receiptFile);

        const response = await ApiService.post('/expenditures', formData, {
          headers: { Authorization: `Bearer ${clientToken}` }
        });
        if (!response) throw new Error(`Failed to add expense: ${item.description}`);

        const createdExpenseId = getCreatedExpenseId(response);
        if (!createdExpenseId) {
          throw new Error(`The API did not return an expense ID for: ${item.description}`);
        }

        groupMap[String(createdExpenseId)] = batchGroupId;

        if (!categories.includes(item.category) && !addedCategories.includes(item.category)) {
          addedCategories.push(item.category);
        }
        firstItem = false;
      }

      saveExpenseGroupMap(groupMap);

      if (addedCategories.length) setCategories(prev => [...prev, ...addedCategories]);
      await fetchExpenditures();
      alert(validItems.length === 1 ? 'Expense added successfully!' : `${validItems.length} expenses added successfully!`);
      closeModal();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert(`Failed to ${editingExpense ? 'update' : 'add'} expense: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Groups records having the same date + category into one table row.
  // The original records remain intact inside group.items for View/PDF/Delete.
  // Grouping is based on the Add Expense submission, not date or category.
  // Rows created together share groupId; a later Add Expense gets a new groupId.
  // Old records without groupId remain individual rows.
  const groupedExpenditures = expenditures.reduce((groups, expense) => {
    const key = expense.groupId ? `group-${expense.groupId}` : `single-${expense.id}`;

    if (!groups[key]) {
      groups[key] = {
        id: key,
        groupId: expense.groupId || null,
        date: expense.date,
        category: '',
        status: expense.status,
        adminName: expense.adminName,
        receiptImage: expense.receiptImage,
        items: [],
        amount: 0
      };
    }

    groups[key].items.push(expense);
    groups[key].amount += Number(expense.amount || 0);

    const groupCategories = groups[key].items
      .map(item => item.category?.trim())
      .filter(Boolean);
    groups[key].category = [...new Set(groupCategories)].join(', ');

    if (expense.status === 'Pending') groups[key].status = 'Pending';
    if (!groups[key].adminName && expense.adminName) groups[key].adminName = expense.adminName;
    if (!groups[key].receiptImage && expense.receiptImage) groups[key].receiptImage = expense.receiptImage;

    return groups;
  }, {});

  const groupedList = Object.values(groupedExpenditures).sort((a, b) => {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  const filteredExpenditures = groupedList.filter(group => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      group.category.toLowerCase().includes(term) ||
      group.items.some(item => item.description.toLowerCase().includes(term));
    const matchesCategory = categoryFilter === 'All' || group.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || group.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalItems = filteredExpenditures.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedExpenditures = filteredExpenditures.slice(startIndex, endIndex);

  const handlePageChange = page => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const handlePreviousPage = () => safeCurrentPage > 1 && setCurrentPage(safeCurrentPage - 1);
  const handleNextPage = () => safeCurrentPage < totalPages && setCurrentPage(safeCurrentPage + 1);
  const getPageNumbers = () => {
    const pages = [];
    const max = 5;
    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const handleViewDetails = group => setShowDetails(group);
  const handleCloseDetails = () => setShowDetails(null);

  const handleDelete = async (group) => {
    const count = group.items.length;
    if (!window.confirm(`Delete ${count > 1 ? `${count} expenses` : `expense "${group.items[0].description}"`}? This cannot be undone.`)) return;

    try {
      setDeletingId(group.id);
      const groupMap = getExpenseGroupMap();
      for (const item of group.items) {
        await ApiService.delete(`/expenditures/${item.id}`, {
          headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' }
        });
        delete groupMap[String(item.id)];
      }
      saveExpenseGroupMap(groupMap);
      setExpenditures(prev => prev.filter(exp => !group.items.some(item => item.id === exp.id)));
      alert(count > 1 ? `${count} expenses deleted successfully!` : 'Expense deleted successfully!');
      await fetchExpenditures();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const downloadExpensePDF = group => {
    try {
      const doc = new jsPDF();
      const safeName = `${group.category || 'Expense'}_${group.date || Date.now()}`
        .replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Expense Details', 20, 25);
      doc.setDrawColor(220, 220, 220);
      doc.line(20, 32, 190, 32);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${group.date || 'N/A'}`, 20, 45);
      doc.text(`Category: ${group.category || 'N/A'}`, 20, 53);
      doc.text(`Status: ${group.status || 'N/A'}`, 20, 61);
      doc.text(`Added By: ${group.adminName || 'N/A'}`, 20, 69);

      let y = 84;
      doc.setFont('helvetica', 'bold');
      doc.text('Expense Items', 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');

      group.items.forEach((item, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${item.description}`, 125);
        if (y > 260) { doc.addPage(); y = 25; }
        doc.text(lines, 20, y);
        doc.text(`INR ${Number(item.amount || 0).toFixed(2)}`, 155, y);
        y += Math.max(7, lines.length * 6) + 3;
      });

      if (y > 270) { doc.addPage(); y = 25; }
      doc.setDrawColor(180, 180, 180);
      doc.line(20, y, 190, y);
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount:', 20, y);
      doc.text(`INR ${Number(group.amount || 0).toFixed(2)}`, 155, y);
      doc.save(`Expense_${safeName}.pdf`);
    } catch (error) {
      console.error('Error generating expense PDF:', error);
      alert('Failed to download expense PDF. Please try again.');
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 p-6">

          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                  <h2 className="text-xl font-bold text-gray-900">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
                  <button onClick={closeModal} disabled={saving} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={20} /></button>
                </div>

                <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <form onSubmit={handleSaveExpense}>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                        <input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={saving} />
                      </div>

                      <div className="space-y-4">
                          {expenseItems.map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-800">Expense {index + 1}</h3>
                                {expenseItems.length > 1 && (
                                  <button type="button" onClick={() => removeExpenseItem(index)} className="text-red-500 hover:text-red-700" disabled={saving} title="Remove row"><FaMinusCircle /></button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                                  <select value={item.category} onChange={e => updateExpenseItem(index, 'category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={saving}>
                                    <option value="">Select category...</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                                  <input type="text" value={item.description} onChange={e => updateExpenseItem(index, 'description', e.target.value)} placeholder="Enter description" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={saving} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input type="number" value={item.amount} onChange={e => updateExpenseItem(index, 'amount', e.target.value)} min="0.01" step="0.01" placeholder="0.00" className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={saving} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={addExpenseItem} disabled={saving} className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                            <FaPlus /> Add Another Expense
                          </button>
                          <div className="flex justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                            <span className="font-medium text-gray-700">Total Amount</span>
                            <span className="text-lg font-bold text-blue-700">₹{expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)}</span>
                          </div>
                        </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Receipt Image {editingExpense ? '(leave empty to keep current)' : '(optional)'}</label>
                        {!receiptPreview ? (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                            <FaUpload className="text-gray-400 mb-2" size={22} />
                            <span className="text-sm text-gray-600">Click to upload receipt</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5 MB</span>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={saving} />
                          </label>
                        ) : (
                          <div className="relative border rounded-lg p-2">
                            <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-48 object-contain rounded" />
                            <button type="button" onClick={removeReceipt} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5" disabled={saving}><FaTimes size={12} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6 flex justify-end gap-3">
                      <button type="button" onClick={closeModal} disabled={saving} className="px-5 py-2 border rounded-lg">Cancel</button>
                      <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                        {saving && <FaSpinner className="animate-spin mr-2" />}
                        {editingExpense ? (saving ? 'Updating...' : 'Update Expense') : (saving ? 'Adding...' : 'Add Expense')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
                  <button onClick={handleCloseDetails} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={20} /></button>
                </div>
                <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                    <div className="bg-gray-50 rounded-lg p-3"><label className="block text-xs text-gray-500 mb-1">Date</label><p className="font-semibold">{showDetails.date}</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><label className="block text-xs text-gray-500 mb-1">Category</label><p className="font-semibold">{showDetails.category}</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><label className="block text-xs text-gray-500 mb-1">Status</label><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(showDetails.status)}`}>{showDetails.status}</span></div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase">
                      <span className="col-span-1">#</span><span className="col-span-8">Description</span><span className="col-span-3 text-right">Amount</span>
                    </div>
                    {showDetails.items.map((item, index) => (
                      <div key={item.id || index} className="px-4 py-3 grid grid-cols-12 border-t text-sm">
                        <span className="col-span-1 text-gray-500">{index + 1}</span>
                        <span className="col-span-8 text-gray-900"><span className="font-medium">{item.category}</span><span className="block text-xs text-gray-500 mt-0.5">{item.description}</span></span>
                        <span className="col-span-3 text-right font-semibold">₹{Number(item.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="px-4 py-4 grid grid-cols-12 border-t bg-blue-50">
                      <span className="col-span-9 font-bold">Total</span>
                      <span className="col-span-3 text-right font-bold text-blue-700">₹{Number(showDetails.amount || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {showDetails.adminName && <p className="text-xs text-gray-500 mt-4">Added by {showDetails.adminName}</p>}
                  {showDetails.receiptImage && <img src={`${API_BASE_URL.replace('/api', '')}/${showDetails.receiptImage}`} alt="Receipt" className="w-full max-h-60 object-contain border rounded-lg mt-4" />}

                  <div className="flex gap-3 mt-5">
                    <button onClick={() => downloadExpensePDF(showDetails)} className="flex-1 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"><FaFilePdf /> Download PDF</button>
                    <button onClick={handleCloseDetails} className="flex-1 px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div><h1 className="text-2xl font-bold text-gray-800">Track and manage business expenses</h1><p className="text-gray-600 mt-1">Monitor all expenditures and approvals</p></div>
              <div className="flex items-center gap-2">
                {loading && <div className="flex items-center text-gray-500"><FaSpinner className="animate-spin mr-2" />Loading...</div>}
                <button onClick={openAddModal} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"><FaPlus /><span>Add Expense</span></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6"><div className="text-sm text-gray-600">Total Expenses</div><div className="text-3xl font-bold text-gray-800">₹{Number(stats.totalExpenses || 0).toFixed(2)}</div><div className="text-sm text-gray-500 mt-2">All time total</div></div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"><div className="text-sm text-gray-600">Pending Approval</div><div className="text-3xl font-bold text-yellow-600">₹{Number(stats.pendingAmount || 0).toFixed(2)}</div><div className="text-sm text-gray-500 mt-2">{stats.pendingItems} items</div></div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6"><div className="text-sm text-gray-600">Categories</div><div className="text-3xl font-bold text-green-600">{categories.length}</div><div className="text-sm text-gray-500 mt-2">Active categories</div></div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6"><div className="text-sm text-gray-600">Total Items</div><div className="text-3xl font-bold text-purple-600">{stats.totalItems || 0}</div><div className="text-sm text-gray-500 mt-2">All expenses</div></div>
            </div>

            <div className="bg-white p-4 rounded-lg border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search expenses by description or category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="All">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="All">All Status</option><option value="Pending">Pending</option><option value="Approved">Approved</option></select>
              </div>
            </div>

            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr>
                    {['Date','Categories','Description','Amount','Status','Added By','Actions'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
                  </tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? <tr><td colSpan="7" className="px-6 py-12 text-center"><FaSpinner className="animate-spin inline text-2xl text-blue-600 mr-3" />Loading expenses...</td></tr> : filteredExpenditures.length === 0 ? <tr><td colSpan="7" className="px-6 py-12 text-center"><div className="text-gray-400 mb-2">No expenses found</div><div className="text-gray-500 text-sm">{searchTerm || categoryFilter !== 'All' || statusFilter !== 'All' ? 'Try adjusting your search or filters' : 'Add your first expense using the button above'}</div></td></tr> : paginatedExpenditures.map(group => (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{group.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{group.items.length} item{group.items.length > 1 ? 's' : ''}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{group.items.map(item => `${item.category}: ${item.description}`).join(', ')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{Number(group.amount || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(group.status)}`}>{group.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{group.adminName || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="flex items-center gap-3">
                          <button onClick={() => handleViewDetails(group)} className="text-blue-600 hover:text-blue-900 p-1" title="View All Details"><FaEye /></button>
                          <button onClick={() => openEditModal(group)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit All Items"><FaEdit /></button>
                          <button onClick={() => downloadExpensePDF(group)} className="text-red-600 hover:text-red-800 p-1" title="Download PDF"><FaFilePdf /></button>
                          <button onClick={() => handleDelete(group)} className="text-red-600 hover:text-red-900 p-1" title="Delete All Items in Group" disabled={deletingId === group.id}>{deletingId === group.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredExpenditures.length > 0 && <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 border-t">
                <div className="text-sm text-gray-600">Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to <span className="font-medium text-gray-900">{endIndex}</span> of <span className="font-medium text-gray-900">{totalItems}</span> expense groups</div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={handlePreviousPage} disabled={safeCurrentPage === 1} className="px-3 py-2 text-sm border rounded-lg disabled:text-gray-400 disabled:bg-gray-50">Previous</button>
                  {getPageNumbers().map(page => <button key={page} type="button" onClick={() => handlePageChange(page)} className={`min-w-[40px] px-3 py-2 text-sm border rounded-lg ${safeCurrentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>{page}</button>)}
                  <button type="button" onClick={handleNextPage} disabled={safeCurrentPage === totalPages} className="px-3 py-2 text-sm border rounded-lg disabled:text-gray-400 disabled:bg-gray-50">Next</button>
                </div>
              </div>}
            </div>
          </div>
    </div>
  );
};

export default Expenditures;
