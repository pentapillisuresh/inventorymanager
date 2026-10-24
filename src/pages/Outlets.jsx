
import React, { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import ApiService from "../utils/ApiService";

const INITIAL_FORM = {
  name: "",
  address: "",
  contactPerson: "",
  phoneNumber: "",
  creditLimit: 5000,
  type: "custom",
  password: "",
  outletType: "inventory",
  isActive: true,
};

const inputClass = (error) =>
  `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 ${
    error
      ? "border-red-400 focus:border-red-500"
      : "border-gray-200 focus:border-primary-500"
  }`;

const Outlets = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [outletPage, setOutletPage] = useState(1);
  const outletsPerPage = 20;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const clientToken = localStorage.getItem("token");
  const storeId = localStorage.getItem("storeId");

  let userId = null;

  try {
    const userData = localStorage.getItem("user");
    userId = userData ? JSON.parse(userData)?.id : null;
  } catch {
    userId = null;
  }

  const headers = {
    Authorization: `Bearer ${clientToken}`,
    "Content-Type": "application/json",
  };

  // ---------------- API ----------------

  const fetchOutlets = async () => {
    const response = await ApiService.get("/outlets", {
      params: { storeId },
      headers,
    });
    return response;
  };

  const createOutlet = async (data) => {
    return ApiService.post("/outlets", data, { headers });
  };

  const updateOutlet = async (id, data) => {
    return ApiService.put(`/outlets/${id}`, data, { headers });
  };

  const deleteOutlet = async (id) => {
    return ApiService.put(
      `/outlets/${id}`,
      { isActive: false },
      { headers }
    );
  };

  const loadOutlets = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchOutlets();
      setOutlets(response?.outlets || []);
    } catch (err) {
      console.error("Error loading outlets:", err);
      setError("Failed to load outlets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutlets();

    const handleOpenAddModal = () => {
      resetForm();
      setShowAddModal(true);
    };

    window.addEventListener("openAddOutletModal", handleOpenAddModal);

    return () => {
      window.removeEventListener(
        "openAddOutletModal",
        handleOpenAddModal
      );
    };
    // Initial load and sidebar event registration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Form handling ----------------

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "isActive"
          ? value === "true"
          : name === "creditLimit"
            ? value
            : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validateForm = (isEditing = false) => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Outlet name is required.";
    }

    if (!formData.address.trim()) {
      nextErrors.address = "Address is required.";
    }

    if (!formData.contactPerson.trim()) {
      nextErrors.contactPerson = "Contact person is required.";
    }

    if (!formData.phoneNumber.trim()) {
      nextErrors.phoneNumber = "Phone number is required.";
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(formData.phoneNumber.trim())) {
      nextErrors.phoneNumber = "Enter a valid phone number.";
    }

    if (
      formData.creditLimit === "" ||
      !Number.isFinite(Number(formData.creditLimit)) ||
      Number(formData.creditLimit) < 0
    ) {
      nextErrors.creditLimit = "Enter a valid credit limit.";
    }

    if (!isEditing && !formData.password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (
      !isEditing &&
      formData.password.length < 8
    ) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (
      !["inventory", "non-inventory"].includes(formData.outletType)
    ) {
      nextErrors.outletType = "Please select an outlet type.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM });
    setErrors({});
    setShowPassword(false);
  };

  const handleAddOutlet = async (event) => {
    event.preventDefault();

    if (!validateForm(false)) return;

    if (!userId || !storeId) {
      alert("User or store information is missing. Please log in again.");
      return;
    }

    setSaving(true);

    try {
      const outletData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        contactPerson: formData.contactPerson.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        creditLimit: Number(formData.creditLimit),
        password: formData.password,
        outletType: formData.outletType,
        type: formData.type,
        managerId: userId,
        storeId,
      };

      const response = await createOutlet(outletData);

      if (response?.message !== "Outlet created successfully") {
        throw new Error(
          response?.message || "Failed to create outlet."
        );
      }

      await loadOutlets();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Error creating outlet:", err);
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to create outlet."
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (outlet) => {
    setSelectedOutlet(outlet);

    setFormData({
      name: outlet.name || "",
      address: outlet.address || "",
      contactPerson: outlet.contactPerson || "",
      phoneNumber: outlet.phoneNumber || "",
      creditLimit: Number(outlet.creditLimit || 0),
      type: outlet.type || "custom",
      password: "",
      outletType: outlet.outletType || "inventory",
      isActive: Boolean(outlet.isActive),
    });

    setErrors({});
    setShowPassword(false);
    setShowEditModal(true);
  };

  const handleEditOutlet = async (event) => {
    event.preventDefault();

    if (!selectedOutlet || !validateForm(true)) return;

    setSaving(true);

    try {
      const outletData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        contactPerson: formData.contactPerson.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        creditLimit: Number(formData.creditLimit),
        type: formData.type,
        outletType: formData.outletType,
        isActive: formData.isActive,
      };

      // Only send a password when a new one is explicitly entered.
      if (formData.password.trim()) {
        if (formData.password.length < 8) {
          setErrors({
            password: "Password must be at least 8 characters.",
          });
          return;
        }

        outletData.password = formData.password;
      }

      const response = await updateOutlet(
        selectedOutlet.id,
        outletData
      );

      if (response?.message !== "Outlet updated successfully") {
        throw new Error(
          response?.message || "Failed to update outlet."
        );
      }

      await loadOutlets();
      setShowEditModal(false);
      setSelectedOutlet(null);
      resetForm();
    } catch (err) {
      console.error("Error updating outlet:", err);
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to update outlet."
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (outlet) => {
    setSelectedOutlet(outlet);
    setShowDeleteModal(true);
  };

  const handleDeleteOutlet = async () => {
    if (!selectedOutlet) return;

    setSaving(true);

    try {
      const response = await deleteOutlet(selectedOutlet.id);

      if (response?.message !== "Outlet deleted successfully") {
        throw new Error(
          response?.message || "Failed to deactivate outlet."
        );
      }

      await loadOutlets();
      setShowDeleteModal(false);
      setSelectedOutlet(null);
    } catch (err) {
      console.error("Error deleting outlet:", err);
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to deactivate outlet."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------- Search, filters, pagination ----------------

  const filteredOutlets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return outlets.filter((outlet) => {
      const matchesSearch = [
        outlet.name,
        outlet.address,
        outlet.contactPerson,
        outlet.phoneNumber,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        filterStatus === "All" ||
        (filterStatus === "Active" && outlet.isActive) ||
        (filterStatus === "Inactive" && !outlet.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [outlets, searchTerm, filterStatus]);

  useEffect(() => {
    setOutletPage(1);
  }, [searchTerm, filterStatus]);

  const totalOutletItems = filteredOutlets.length;
  const totalOutletPages = Math.max(
    1,
    Math.ceil(totalOutletItems / outletsPerPage)
  );

  const safeOutletPage = Math.min(outletPage, totalOutletPages);
  const outletStartIndex = (safeOutletPage - 1) * outletsPerPage;
  const outletEndIndex = Math.min(
    outletStartIndex + outletsPerPage,
    totalOutletItems
  );

  const paginatedOutlets = filteredOutlets.slice(
    outletStartIndex,
    outletEndIndex
  );

  const pageNumbers = [];
  const startPage = Math.max(1, safeOutletPage - 2);
  const endPage = Math.min(totalOutletPages, startPage + 4);

  for (let number = startPage; number <= endPage; number++) {
    pageNumbers.push(number);
  }

  const totalOutlets = outlets.length;
  const activeOutlets = outlets.filter((outlet) => outlet.isActive).length;
  const inactiveOutlets = totalOutlets - activeOutlets;
  const totalCredit = outlets.reduce(
    (sum, outlet) => sum + Number(outlet.currentCredit || 0),
    0
  );

  const statusClass = (active) =>
    active
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-100 text-gray-600 border-gray-200";

  // ---------------- Shared form fields ----------------

  const renderFields = (isEditing = false) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Outlet Name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter outlet name"
          className={inputClass(errors.name)}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={2}
          placeholder="Enter complete address"
          className={inputClass(errors.address)}
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-500">{errors.address}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Contact Person <span className="text-red-500">*</span>
        </label>
        <input
          name="contactPerson"
          value={formData.contactPerson}
          onChange={handleInputChange}
          placeholder="Contact person's name"
          className={inputClass(errors.contactPerson)}
        />
        {errors.contactPerson && (
          <p className="mt-1 text-xs text-red-500">
            {errors.contactPerson}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          placeholder="Enter phone number"
          className={inputClass(errors.phoneNumber)}
        />
        {errors.phoneNumber && (
          <p className="mt-1 text-xs text-red-500">
            {errors.phoneNumber}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Credit Limit (₹)
        </label>
        <input
          type="number"
          min="0"
          step="100"
          name="creditLimit"
          value={formData.creditLimit}
          onChange={handleInputChange}
          className={inputClass(errors.creditLimit)}
        />
        {errors.creditLimit && (
          <p className="mt-1 text-xs text-red-500">
            {errors.creditLimit}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Outlet Category
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className={inputClass(false)}
        >
          <option value="custom">Custom</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Type of Outlet <span className="text-red-500">*</span>
        </label>
        <select
          name="outletType"
          value={formData.outletType}
          onChange={handleInputChange}
          className={inputClass(errors.outletType)}
        >
          <option value="inventory">Inventory</option>
          <option value="non-inventory">Non-Inventory</option>
        </select>
        <p className="mt-1.5 text-xs text-gray-500">
          Select whether this outlet manages inventory.
        </p>
        {errors.outletType && (
          <p className="mt-1 text-xs text-red-500">
            {errors.outletType}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          {isEditing ? "Change Password (optional)" : "Password *"}
          {!isEditing && <span className="text-red-500"> *</span>}
        </label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            autoComplete="new-password"
            minLength={8}
            placeholder={
              isEditing
                ? "Leave blank to keep current password"
                : "Minimum 8 characters"
            }
            className={`${inputClass(errors.password)} pr-12`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-primary-600"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}

        <p className="mt-1.5 text-xs text-gray-500">
          {isEditing
            ? "Enter a new password only if you want to change it."
            : "Create a secure password for this outlet."}
        </p>
      </div>

      {isEditing && (
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Outlet Status
          </label>
          <select
            name="isActive"
            value={String(formData.isActive)}
            onChange={handleInputChange}
            className={inputClass(false)}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      )}
    </div>
  );

  const renderModal = (isEditing) => {
    const close = () => {
      if (isEditing) {
        setShowEditModal(false);
        setSelectedOutlet(null);
      } else {
        setShowAddModal(false);
      }

      resetForm();
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) close();
        }}
      >
        <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? "Edit Outlet" : "Add New Outlet"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isEditing
                  ? "Update outlet details and preferences."
                  : "Enter outlet information to create a new outlet."}
              </p>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={close}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close modal"
            >
              <FiX size={21} />
            </button>
          </div>

          <form
            onSubmit={isEditing ? handleEditOutlet : handleAddOutlet}
            className="max-h-[75vh] overflow-y-auto"
          >
            <div className="p-6">{renderFields(isEditing)}</div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row">
              <button
                type="button"
                disabled={saving}
                onClick={close}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Update Outlet"
                    : "Create Outlet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ---------------- Page ----------------

  if (loading && outlets.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
          <p className="mt-4 text-sm text-gray-600">Loading outlets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Outlet Management
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage outlets, outlet types, contacts and credit limits.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <FiPlus size={18} />
            Add Outlet
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-sm text-red-700">
              <FiAlertCircle size={18} />
              {error}
            </p>
            <button
              type="button"
              onClick={loadOutlets}
              className="text-sm font-semibold text-red-700 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Outlets",
              value: totalOutlets,
              description: "Registered outlets",
            },
            {
              label: "Active Outlets",
              value: activeOutlets,
              description: "Currently active",
            },
            {
              label: "Inactive Outlets",
              value: inactiveOutlets,
              description: "Currently inactive",
            },
            {
              label: "Total Credit",
              value: `₹${totalCredit.toLocaleString("en-IN")}`,
              description: "Current outstanding credit",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Search and filter */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <FiSearch
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by outlet, address, contact or phone..."
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="relative">
              <FiFilter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-9 text-sm outline-none focus:border-primary-500 sm:w-44"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Outlets table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-900">All Outlets</h2>
              <p className="mt-1 text-xs text-gray-500">
                {totalOutletItems} outlet(s) found
              </p>
            </div>

            <button
              type="button"
              onClick={loadOutlets}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {[
                    "Outlet",
                    "Address",
                    "Contact Person",
                    "Phone",
                    "Outlet Mode",
                    "Credit Limit",
                    "Current Credit",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedOutlets.map((outlet) => {
                  const creditLimit = Number(outlet.creditLimit || 0);
                  const currentCredit = Number(outlet.currentCredit || 0);

                  return (
                    <tr
                      key={outlet.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <p className="whitespace-nowrap text-sm font-semibold text-gray-900">
                          {outlet.name}
                        </p>
                        <p className="mt-1 text-xs capitalize text-gray-500">
                          {outlet.type || "custom"}
                        </p>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-gray-600">
                        <div className="truncate">{outlet.address}</div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {outlet.contactPerson || "N/A"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {outlet.phoneNumber || "N/A"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex whitespace-nowrap rounded-lg border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
                          {outlet.outletType === "non-inventory"
                            ? "Non-Inventory"
                            : "Inventory"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        ₹{creditLimit.toLocaleString("en-IN")}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`text-sm font-semibold ${
                            currentCredit > creditLimit
                              ? "text-red-600"
                              : "text-gray-700"
                          }`}
                        >
                          ₹{currentCredit.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                            outlet.isActive
                          )}`}
                        >
                          <FiCheckCircle size={13} />
                          {outlet.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(outlet)}
                            title="Edit outlet"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <FiEdit2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(outlet)}
                            title="Deactivate outlet"
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedOutlets.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-14 text-center text-sm text-gray-500"
                    >
                      <FiSearch
                        size={28}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      {searchTerm || filterStatus !== "All"
                        ? "No outlets match your search or filter."
                        : "No outlets available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalOutletItems > 0 && (
            <div className="flex flex-col justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {outletStartIndex + 1}–{outletEndIndex}
                </span>{" "}
                of {totalOutletItems} outlets
              </p>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={safeOutletPage === 1}
                  onClick={() => setOutletPage(safeOutletPage - 1)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setOutletPage(number)}
                    className={`min-w-9 rounded-lg border px-3 py-2 text-sm ${
                      number === safeOutletPage
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={safeOutletPage === totalOutletPages}
                  onClick={() => setOutletPage(safeOutletPage + 1)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add and edit modals */}
        {showAddModal && renderModal(false)}
        {showEditModal && renderModal(true)}

        {/* Delete confirmation */}
        {showDeleteModal && selectedOutlet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <FiAlertCircle size={25} />
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Deactivate Outlet
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Are you sure you want to deactivate{" "}
                <strong className="text-gray-800">
                  {selectedOutlet.name}
                </strong>
                ? This will mark the outlet as inactive.
              </p>

              {Number(selectedOutlet.currentCredit || 0) > 0 && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  Outstanding credit: ₹
                  {Number(selectedOutlet.currentCredit).toLocaleString("en-IN")}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedOutlet(null);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDeleteOutlet}
                  className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? "Processing..." : "Deactivate Outlet"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Outlets;
