import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, ClipboardList, Eye, X, Package, Store, UserRound, CalendarDays, MapPin, Phone, Check, CheckCircle2, Clock3, CreditCard, Banknote, ChevronLeft, ChevronRight, RotateCcw, Filter, FileText, ShoppingBag, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";

// ⚠️ Update this to your actual backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://service.billmitras.com/api";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const statusStyle = {
  pending: "bg-orange-50 text-orange-700 border-orange-200",
  partially_approved: "bg-orange-100 text-orange-800 border-orange-300",
  approved: "bg-orange-600 text-white border-orange-600",
  completed: "bg-orange-700 text-white border-orange-700",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ status, paymentStatus }) {
  const normalizedStatus = (status || "pending").toLowerCase().replace(/\s+/g, "_");
  const normalizedPayment = (paymentStatus || "pending").toLowerCase();

  let displayStatus;
  let badgeClass;
  let Icon;

  if (normalizedPayment === "credit") {
    displayStatus = "Awaiting Payment";
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    Icon = CreditCard;
  } else if (normalizedPayment === "paid" || normalizedStatus === "fulfilled") {
    displayStatus = "Completed";
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    Icon = CheckCircle2;
  } else if (normalizedStatus === "partially_approved") {
    displayStatus = "Partially Approved";
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    Icon = Clock3;
  } else if (normalizedStatus === "rejected") {
    displayStatus = "Rejected";
    badgeClass = "bg-red-50 text-red-700 border-red-200";
    Icon = X;
  } else if (normalizedStatus === "approved") {
    displayStatus = "Approved";
    badgeClass = "bg-orange-50 text-orange-700 border-orange-200";
    Icon = CheckCircle2;
  } else {
    displayStatus = "Pending";
    badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    Icon = Clock3;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${badgeClass}`}>
      <Icon size={13} />
      {displayStatus}
    </span>
  );
}

function MetricCard({ label, value, icon: Icon, description, isLoading }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="rounded-xl bg-orange-50 p-2.5 text-orange-700">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24} /> : value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default function OutletRequests() {
  // --- API Data States ---
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({
    totalRequests: 0,
    pendingApproval: 0,
    awaitingPayment: 0,
    completed: 0,
    outstandingValue: 0,
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // --- UI States ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  const [isLoading, setIsLoading] = useState(true);

  // --- Modal States ---
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // --- Local UI State for Payment (Mocking since backend doesn't have confirm endpoint in prompt) ---
  const [paymentChoice, setPaymentChoice] = useState({});
  const [notice, setNotice] = useState("");

  // =========================================================
  // 1. Fetch Dashboard Data
  // =========================================================
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const apiStatus = statusFilter === "All" ? "" : statusFilter.toLowerCase();
      
      const response = await axios.get(`${API_BASE_URL}/stock-requests/admin-dashboard`, {
        params: {
          search,
          status: apiStatus,
          paymentStatus: paymentFilter === "Credit" ? "credit" : "",
          page,
          limit: pageSize,
        },
      });

      if (response.data.success) {
        setRequests(response.data.requests);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      setNotice("Failed to load requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, paymentFilter, page, pageSize]);

  // =========================================================
  // 2. Fetch Request Details (Modal)
  // =========================================================
  const openDetails = async (requestId) => {
    setSelectedId(requestId);
    setSelectedRequest(null);
    setModalLoading(true);
    setNotice("");
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stock-requests/${requestId}/details`);
      if (response.data.success) {
        setSelectedRequest(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load details:", error);
      setNotice("Failed to load request details.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedId(null);
    setSelectedRequest(null);
    setNotice("");
  };

  // =========================================================
  // 3. Approve Actions (Single or Bulk)
  // =========================================================
  const handleApprove = async (itemIds = [], approveAll = false) => {
    if (!selectedRequest) return;
    setIsActionLoading(true);
    setNotice("");

    try {
      const payload = approveAll ? { approveAll: true } : { itemIds };
      
      const response = await axios.patch(
        `${API_BASE_URL}/stock-requests/${selectedRequest.requestId}/approveAll`, 
        payload
      );

      if (response.data.success) {
        setNotice(approveAll ? "All products approved." : "Product approved successfully.");
        
        // Refresh both the modal details and the dashboard list
        await openDetails(selectedRequest.requestId);
        await fetchDashboardData(); 
      }
    } catch (error) {
      console.error("Approval failed:", error);
      setNotice(error.response?.data?.message || "Approval failed. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const approveProduct = (itemId) => handleApprove([itemId], false);
  const approveAll = () => handleApprove([], true);

  // =========================================================
  // 4. Save offline payment status (Paid / Credit)
  // =========================================================
  const updatePaymentStatus = async (paymentStatus) => {
    if (!selectedRequest || isActionLoading) return;

    const normalizedPaymentStatus = String(paymentStatus || "").toLowerCase();
    if (!["paid", "credit"].includes(normalizedPaymentStatus)) {
      setNotice("Please select a valid payment status.");
      return;
    }

    setIsActionLoading(true);
    setNotice("");

    try {
      const requestId = selectedRequest.requestId;
      const response = await axios.patch(
        `${API_BASE_URL}/stock-requests/${requestId}/payment-status`,
        { paymentStatus: normalizedPaymentStatus }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to update payment status.");
      }

      // Refresh the modal and dashboard so the saved database status is shown.
      await openDetails(requestId);
      await fetchDashboardData();
      setPaymentChoice((current) => {
        const next = { ...current };
        delete next[requestId];
        return next;
      });
      setNotice(response.data.message || "Payment status updated successfully.");
    } catch (error) {
      console.error("Payment status update failed:", error);
      setNotice(
        error.response?.data?.message ||
        error.message ||
        "Failed to update payment status. Please try again."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  // Update a credit request directly from the Credit Pending table.
  const markRowAsPaid = async (request) => {
    const requestId = request.requestId || request.id;
    if (!requestId || !window.confirm(`Mark ${request.requestNumber || "this request"} as Paid?`)) return;

    setIsActionLoading(true);
    setNotice("");
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/stock-requests/${requestId}/payment-status`,
        { paymentStatus: "paid" }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to update payment status.");
      }

      setNotice(`${request.requestNumber || "Request"} marked as Paid successfully.`);
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to mark credit request as paid:", error);
      setNotice(
        error.response?.data?.message ||
        error.message ||
        "Failed to update payment status. Please try again."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  // Check if all items are approved based on fetched data
  const allApproved = Boolean(
    selectedRequest?.products?.length &&
    selectedRequest.products.every(
      (product) => ["approved", "partially_approved"].includes(String(product.status || "").toLowerCase())
    )
  );

  const resetDemo = () => {
    setSearch("");
    setStatusFilter("All");
    setPaymentFilter("All");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <span>Store Manager</span>
              <ChevronRight size={15} />
              <span className="font-semibold text-orange-700">Outlet Requests</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-orange-700 p-3 text-white shadow-sm shadow-orange-200">
                <ClipboardList size={25} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Outlet Requests</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage outlet orders, product approvals and payment terms.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
          >
            <RotateCcw size={16} />
            Refresh Data
          </button>
        </div>

        {/* Dashboard metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Requests" value={summary.totalRequests} icon={ClipboardList} description="All outlet requests" isLoading={isLoading} />
          <MetricCard label="Pending Approval" value={summary.pendingApproval} icon={Clock3} description="Products awaiting approval" isLoading={isLoading} />
          <MetricCard label="Awaiting Payment" value={summary.awaitingPayment} icon={CreditCard} description="Approval complete, payment pending" isLoading={isLoading} />
          <MetricCard label="Completed" value={summary.completed} icon={CheckCircle2} description="Requests finalized" isLoading={isLoading} />
        </div>

        {/* Outstanding request value */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-orange-100 bg-white p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-700">
              <Banknote size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Outstanding Request Value</p>
              <p className="mt-1 text-xl font-bold">
                {isLoading ? "..." : money(summary.outstandingValue)}
              </p>
            </div>
          </div>
          <p className="max-w-md text-xs leading-5 text-slate-500">
            Total value of requests not yet completed. This is an order value, not a live accounts receivable balance.
          </p>
        </div>

        {/* Requests table */}
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold">{paymentFilter === "Credit" ? "Credit Pending Requests" : "All Outlet Requests"}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {paymentFilter === "Credit" ? "Review all credit request details and mark each request as Paid after receiving offline payment." : "Search requests and open their details to manage approvals."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search requests..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 sm:w-64"
                />
              </div>
              <div className="relative">
                <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 sm:w-48"
                >
                  <option value="All">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="fulfilled">Completed</option>
                </select>
              </div>
              <div className="relative">
                <CreditCard size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={paymentFilter}
                  onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 sm:w-48"
                >
                  <option value="All">All payments</option>
                  <option value="Credit">Credit Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/70">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Request Details</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Outlet</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Requested On</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Products</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Order Total</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Request / Payment Status</th>
                  {paymentFilter === "Credit" && <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Mark as Paid</th>}
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={paymentFilter === "Credit" ? 8 : 7} className="px-5 py-16 text-center">
                      <Loader2 className="animate-spin text-orange-600 mx-auto" size={32} />
                      <p className="mt-4 text-sm text-slate-500">Loading requests...</p>
                    </td>
                  </tr>
                ) : requests.map((request) => (
                  <tr key={request.id} className="transition hover:bg-orange-50/40">
                    <td className="px-5 py-5">
                      <p className="font-bold text-slate-900">{request.requestNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.totalProducts} product(s)</p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="max-w-[220px] truncate text-sm font-semibold">{request.outletName}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.contactPerson}</p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="text-sm font-medium">{String(request.requestedOn || "—").split('\n')[0]}</p>
                      <p className="mt-1 text-xs text-slate-500">{String(request.requestedOn || "").split('\n')[1] || ""}</p>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-orange-600 transition-all"
                            style={{ width: `${request.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{request.approvalString}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">Approved</p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="whitespace-nowrap text-sm font-bold">{money(request.totalAmount)}</p>
                      {request.paymentStatus && (
                        <p className="mt-1 text-xs font-medium text-orange-700 capitalize">{request.paymentStatus}</p>
                      )}
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge status={request.status} paymentStatus={request.paymentStatus} />
                      <p className="mt-1 text-xs capitalize text-slate-500">Payment: {request.paymentStatus || "pending"}</p>
                    </td>
                    {paymentFilter === "Credit" && (
                      <td className="px-5 py-5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={String(request.paymentStatus || "").toLowerCase() === "paid"}
                          disabled={isActionLoading || String(request.paymentStatus || "").toLowerCase() !== "credit"}
                          onClick={() => markRowAsPaid(request)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${String(request.paymentStatus || "").toLowerCase() === "paid" ? "bg-emerald-600" : "bg-orange-500"}`}
                          title="Mark this credit request as paid"
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${String(request.paymentStatus || "").toLowerCase() === "paid" ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <p className="mt-1 text-xs font-medium text-slate-500">{String(request.paymentStatus || "").toLowerCase() === "paid" ? "Paid" : "Credit pending"}</p>
                      </td>
                    )}
                    <td className="px-5 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(request.id)}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-orange-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-orange-700 transition hover:border-orange-700 hover:bg-orange-700 hover:text-white"
                      >
                        <Eye size={16} /> View Details <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {!isLoading && requests.length === 0 && (
                  <tr>
                    <td colSpan={paymentFilter === "Credit" ? 8 : 7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                        <ClipboardList size={26} />
                      </div>
                      <p className="mt-4 font-semibold">No requests found</p>
                      <p className="mt-1 text-sm text-slate-500">{paymentFilter === "Credit" ? "No credit requests are currently pending." : "Try changing your search or status filter."}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-orange-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>
                {pagination.total === 0 ? "0 results" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, pagination.total)} of ${pagination.total}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((v) => Math.max(1, v - 1))}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="min-w-20 text-center text-sm font-medium text-slate-600">
                Page {page} of {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages || isLoading}
                onClick={() => setPage((v) => Math.min(pagination.totalPages, v + 1))}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* MODAL */}
        {selectedId && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-5"
            onMouseDown={(e) => { if (e.target === e.currentTarget) closeDetails(); }}
          >
            <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
              
              {/* Modal header */}
              <div className="flex items-start justify-between gap-4 border-b border-orange-100 bg-white px-5 py-5 sm:px-7">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-orange-700 p-3 text-white">
                    <FileText size={23} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold sm:text-2xl">Request Details</h2>
                      {selectedRequest && <StatusBadge status={selectedRequest.status} paymentStatus={selectedRequest.paymentStatus} />}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Request ID: {selectedRequest?.requestId || selectedId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-orange-50 hover:text-orange-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/70 p-5 sm:p-7">
                {modalLoading || !selectedRequest ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-orange-600" size={40} />
                    <p className="mt-4 text-slate-500 font-medium">Fetching details...</p>
                  </div>
                ) : (
                  <>
                    {/* Outlet & Summary */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-orange-100 bg-white p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Store size={19} className="text-orange-700" />
                          <h3 className="font-bold">Outlet Information</h3>
                        </div>
                        <p className="text-lg font-bold">{selectedRequest.outletInfo.name}</p>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex items-start gap-2.5 text-slate-600">
                            <UserRound size={16} className="mt-0.5 shrink-0 text-orange-600" />
                            <span>{selectedRequest.outletInfo.contactPerson}</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-slate-600">
                            <Phone size={16} className="mt-0.5 shrink-0 text-orange-600" />
                            <span>{selectedRequest.outletInfo.phoneNumber}</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-slate-600">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-orange-600" />
                            <span>{selectedRequest.outletInfo.address}</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-slate-600">
                            <UserRound size={16} className="mt-0.5 shrink-0 text-orange-600" />
                            <span>{selectedRequest.outletInfo.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-orange-100 bg-white p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <CalendarDays size={19} className="text-orange-700" />
                          <h3 className="font-bold">Request Summary</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-slate-500">Request ID</span>
                            <span className="text-sm font-bold">{selectedRequest.requestId}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-slate-500">Request date</span>
                            <span className="text-right text-sm font-semibold">{selectedRequest.summary.requestDate}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-slate-500">Request time</span>
                            <span className="text-sm font-semibold">{selectedRequest.summary.requestTime}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-slate-500">Total products</span>
                            <span className="text-sm font-semibold">{selectedRequest.summary.totalProducts}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-slate-500">Approval progress</span>
                            <span className="text-sm font-bold text-orange-700">{selectedRequest.summary.approvalProgressString}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-orange-50">
                            <div
                              className="h-full rounded-full bg-orange-600 transition-all"
                              style={{ width: `${selectedRequest.summary.approvalProgressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Products Table */}
                    <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
                      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="flex items-center gap-2 font-bold">
                            <ShoppingBag size={19} className="text-orange-700" /> Requested Products
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">Review each item and approve products individually.</p>
                        </div>
                        <span className="inline-flex items-center gap-2 self-start rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                          <CheckCircle2 size={15} /> {selectedRequest.summary.approvalProgressString} approved
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                          <thead>
                            <tr className="border-b border-orange-100 bg-orange-50/70">
                              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Product</th>
                              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Quantity</th>
                              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Unit Price</th>
                              <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Line Total</th>
                              <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedRequest.products.map((product) => (
                              <tr key={product.itemId} className="hover:bg-orange-50/30">
                                <td className="px-5 py-4">
                                  <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-orange-50 p-2.5 text-orange-700">
                                      <Package size={19} />
                                    </div>
                                    <div>
                                      <p className="font-semibold">{product.productName}</p>
                                      <p className="mt-1 text-xs text-slate-500">SKU: {product.sku}</p>
                                      <p className="mt-1 text-xs text-slate-500">{product.categoryName}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="text-sm font-semibold">{product.quantity}</p>
                                  <p className="mt-1 text-xs text-slate-500">{product.unit}</p>
                                </td>
                                <td className="px-4 py-4 text-sm font-medium">{money(product.unitPrice)}</td>
                                <td className="px-4 py-4 text-sm font-bold">{money(product.lineTotal)}</td>
                                <td className="px-5 py-4 text-right">
                                  {product.status === "approved" || product.status === "partially_approved" ? (
                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-800">
                                      <Check size={14} /> Approved
                                    </span>
                                  ) : selectedRequest.status === "pending" ? (
                                    <button
                                      type="button"
                                      disabled={isActionLoading}
                                      onClick={() => approveProduct(product.itemId)}
                                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-800 disabled:opacity-50"
                                    >
                                      {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-500">Not approved</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-5">
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Total quantity</span>
                          <span className="font-semibold">{selectedRequest.footer.totalQuantity} units</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-3">
                          <span className="font-bold">Grand Total</span>
                          <span className="text-xl font-bold text-orange-800">{money(selectedRequest.footer.grandTotal)}</span>
                        </div>
                      </div>

                      {selectedRequest.status === "pending" && (
                        <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-5 sm:flex-row sm:items-center">
                          <div>
                            <p className="font-semibold">Bulk approval</p>
                            <p className="mt-1 text-sm text-slate-500">Approve all remaining products in this request.</p>
                          </div>
                          <button
                            type="button"
                            onClick={approveAll}
                            disabled={allApproved || isActionLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {isActionLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                            Approve All Products
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Payment & Confirmation - offline payment only */}
                    {allApproved && (
                      <div className="rounded-2xl border border-orange-200 bg-white p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-orange-50 p-3 text-orange-700">
                            <CreditCard size={22} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">Payment & Confirmation</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Payments are handled offline. Select Paid or Credit and save the status.
                            </p>
                          </div>
                        </div>

                        {String(selectedRequest.paymentStatus || "pending").toLowerCase() === "paid" ||
                         String(selectedRequest.status || "").toLowerCase() === "fulfilled" ? (
                          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                            <p className="flex items-center gap-2 font-semibold text-emerald-800">
                              <CheckCircle2 size={20} /> Payment Received
                            </p>
                            <p className="mt-2 text-sm text-emerald-700">
                              This request has been marked as paid and completed.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200 pt-3">
                              <span className="text-sm text-slate-600">Payment Status</span>
                              <span className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-700">
                                PAID
                              </span>
                            </div>
                          </div>
                        ) : String(selectedRequest.paymentStatus || "pending").toLowerCase() === "credit" ? (
                          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                            <div className="flex items-center gap-2 text-amber-800">
                              <CreditCard size={20} />
                              <span className="font-bold">Credit – Payment Pending</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              Payment is being handled offline. Once the manager receives the payment,
                              click Mark as Paid to update this request.
                            </p>
                            <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                  Request Amount
                                </p>
                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                  {money(selectedRequest.footer?.grandTotal ?? selectedRequest.totalAmount)}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => updatePaymentStatus("paid")}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isActionLoading ? (
                                  <Loader2 size={17} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={17} />
                                )}
                                Mark as Paid
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => setPaymentChoice((current) => ({
                                  ...current,
                                  [selectedRequest.requestId]: "Paid"
                                }))}
                                className={`rounded-2xl border-2 p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  paymentChoice[selectedRequest.requestId] === "Paid"
                                    ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-50"
                                    : "border-slate-200 hover:border-emerald-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                                    <Banknote size={23} />
                                  </div>
                                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                    paymentChoice[selectedRequest.requestId] === "Paid"
                                      ? "border-emerald-600 bg-emerald-600 text-white"
                                      : "border-slate-300"
                                  }`}>
                                    {paymentChoice[selectedRequest.requestId] === "Paid" && <Check size={13} />}
                                  </span>
                                </div>
                                <p className="mt-4 font-bold">Paid</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Payment has already been received offline.
                                </p>
                              </button>

                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => setPaymentChoice((current) => ({
                                  ...current,
                                  [selectedRequest.requestId]: "Credit"
                                }))}
                                className={`rounded-2xl border-2 p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  paymentChoice[selectedRequest.requestId] === "Credit"
                                    ? "border-amber-500 bg-amber-50 ring-4 ring-amber-50"
                                    : "border-slate-200 hover:border-amber-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                                    <CreditCard size={23} />
                                  </div>
                                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                    paymentChoice[selectedRequest.requestId] === "Credit"
                                      ? "border-amber-600 bg-amber-600 text-white"
                                      : "border-slate-300"
                                  }`}>
                                    {paymentChoice[selectedRequest.requestId] === "Credit" && <Check size={13} />}
                                  </span>
                                </div>
                                <p className="mt-4 font-bold">Credit</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Payment will be received later. Manager can mark it Paid afterward.
                                </p>
                              </button>
                            </div>

                            <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl bg-orange-50 p-4 sm:flex-row sm:items-center">
                              <div>
                                <p className="text-sm text-slate-600">Final Order Value</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                  {money(selectedRequest.footer?.grandTotal ?? selectedRequest.totalAmount)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => updatePaymentStatus(paymentChoice[selectedRequest.requestId])}
                                disabled={!paymentChoice[selectedRequest.requestId] || isActionLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                {isActionLoading ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={18} />
                                )}
                                Confirm Request
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {notice && (
                      <div role="status" className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <p>{notice}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col-reverse justify-between gap-3 border-t border-orange-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:px-7">
                <p className="text-xs text-slate-500">
                  {selectedRequest?.status === "fulfilled"
                    ? "This request has been completed and marked as paid."
                    : String(selectedRequest?.paymentStatus || "").toLowerCase() === "credit"
                      ? "Payment is pending. Update to Paid after receiving offline payment."
                      : allApproved
                        ? "All products approved. Select Paid or Credit to continue."
                      : "Approve all products before choosing payment terms."}
                </p>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
                >
                  Close Details
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}