
import React, { useMemo, useState } from "react";
import {
  Search,
  ClipboardList,
  Eye,
  X,
  Package,
  Store,
  UserRound,
  CalendarDays,
  MapPin,
  Phone,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
  FileText,
  ShoppingBag,
  AlertCircle,
  Boxes,
  ArrowUpRight,
} from "lucide-react";

const initialRequests = [
  {
    id: "OUT-1025",
    outletName: "Sri Lakshmi General Store",
    ownerName: "Ramesh Kumar",
    phone: "9876543210",
    email: "ramesh@example.com",
    address: "MVP Colony, Visakhapatnam, Andhra Pradesh",
    requestedAt: "2026-10-24T09:30:00",
    status: "Pending",
    paymentType: "",
    products: [
      {
        id: 1,
        name: "Premium Rice",
        sku: "RIC-001",
        category: "Rice & Grains",
        quantity: 2,
        unit: "25 kg bag",
        price: 1450,
        approved: false,
      },
      {
        id: 2,
        name: "Sunflower Oil",
        sku: "OIL-002",
        category: "Cooking Essentials",
        quantity: 4,
        unit: "5 L can",
        price: 720,
        approved: false,
      },
      {
        id: 3,
        name: "Toor Dal",
        sku: "DAL-003",
        category: "Pulses",
        quantity: 5,
        unit: "1 kg pack",
        price: 145,
        approved: false,
      },
    ],
  },
  {
    id: "OUT-1024",
    outletName: "Venkateswara Super Market",
    ownerName: "Suresh Rao",
    phone: "9876501234",
    email: "suresh@example.com",
    address: "Madhurawada, Visakhapatnam, Andhra Pradesh",
    requestedAt: "2026-10-24T08:15:00",
    status: "Pending",
    paymentType: "",
    products: [
      {
        id: 1,
        name: "Basmati Rice",
        sku: "RIC-004",
        category: "Rice & Grains",
        quantity: 3,
        unit: "10 kg bag",
        price: 950,
        approved: true,
      },
      {
        id: 2,
        name: "Wheat Flour",
        sku: "FLR-005",
        category: "Flour",
        quantity: 6,
        unit: "5 kg bag",
        price: 240,
        approved: true,
      },
    ],
  },
  {
    id: "OUT-1023",
    outletName: "Sai Ram Kirana Shop",
    ownerName: "Ravi Teja",
    phone: "9123456780",
    email: "ravi@example.com",
    address: "Gajuwaka, Visakhapatnam, Andhra Pradesh",
    requestedAt: "2026-10-23T16:45:00",
    status: "Completed",
    paymentType: "Credit",
    products: [
      {
        id: 1,
        name: "Sugar",
        sku: "SUG-006",
        category: "Essentials",
        quantity: 10,
        unit: "1 kg pack",
        price: 48,
        approved: true,
      },
      {
        id: 2,
        name: "Sunflower Oil",
        sku: "OIL-002",
        category: "Cooking Essentials",
        quantity: 2,
        unit: "5 L can",
        price: 720,
        approved: true,
      },
    ],
  },
  {
    id: "OUT-1022",
    outletName: "Sri Durga Traders",
    ownerName: "Prasad",
    phone: "9988776655",
    email: "prasad@example.com",
    address: "Anakapalle, Andhra Pradesh",
    requestedAt: "2026-10-22T11:20:00",
    status: "Completed",
    paymentType: "Paid",
    products: [
      {
        id: 1,
        name: "Premium Rice",
        sku: "RIC-001",
        category: "Rice & Grains",
        quantity: 5,
        unit: "25 kg bag",
        price: 1450,
        approved: true,
      },
    ],
  },
];

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getTotal = (request) =>
  request.products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

const getApprovedCount = (request) =>
  request.products.filter((product) => product.approved).length;

const statusStyle = {
  Pending: "bg-blue-50 text-blue-700 border-blue-200",
  "Awaiting Payment": "bg-blue-100 text-blue-800 border-blue-300",
  Completed: "bg-blue-700 text-white border-blue-700",
};

function StatusBadge({ status }) {
  const Icon =
    status === "Completed"
      ? CheckCircle2
      : status === "Awaiting Payment"
        ? CreditCard
        : Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyle[status] || statusStyle.Pending}`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}

function MetricCard({ label, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default function OutletRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [paymentChoice, setPaymentChoice] = useState({});
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const selectedRequest =
    requests.find((request) => request.id === selectedId) || null;

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        request.id.toLowerCase().includes(query) ||
        request.outletName.toLowerCase().includes(query) ||
        request.ownerName.toLowerCase().includes(query) ||
        request.phone.includes(query);

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const awaitingCount = requests.filter(
    (request) => request.status === "Awaiting Payment"
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "Completed"
  ).length;

  const pendingValue = requests
    .filter((request) => request.status !== "Completed")
    .reduce((sum, request) => sum + getTotal(request), 0);

  const allApproved = selectedRequest
    ? selectedRequest.products.every((product) => product.approved)
    : false;

  const updateRequest = (requestId, updater) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? updater(request) : request
      )
    );
  };

  const openDetails = (requestId) => {
    setSelectedId(requestId);
    setNotice("");
  };

  const closeDetails = () => {
    setSelectedId(null);
    setNotice("");
  };

  const approveProduct = (productId) => {
    if (!selectedRequest || selectedRequest.status !== "Pending") return;

    updateRequest(selectedRequest.id, (request) => {
      const products = request.products.map((product) =>
        product.id === productId
          ? { ...product, approved: true }
          : product
      );

      return {
        ...request,
        products,
        status: products.every((product) => product.approved)
          ? "Awaiting Payment"
          : "Pending",
      };
    });

    setNotice("Product approved successfully.");
  };

  const approveAll = () => {
    if (!selectedRequest || selectedRequest.status !== "Pending") return;

    updateRequest(selectedRequest.id, (request) => ({
      ...request,
      products: request.products.map((product) => ({
        ...product,
        approved: true,
      })),
      status: "Awaiting Payment",
    }));

    setNotice("All products approved. Select a payment type to continue.");
  };

  const confirmRequest = () => {
    if (!selectedRequest) return;

    if (selectedRequest.status === "Completed") {
      setNotice("This request has already been completed.");
      return;
    }

    if (!allApproved) {
      setNotice("Approve every product before confirming this request.");
      return;
    }

    const paymentType = paymentChoice[selectedRequest.id];

    if (!paymentType) {
      setNotice("Please select Paid or Credit.");
      return;
    }

    updateRequest(selectedRequest.id, (request) => ({
      ...request,
      status: "Completed",
      paymentType,
    }));

    setNotice(
      `Request ${selectedRequest.id} completed with payment type ${paymentType}.`
    );
  };

  const resetDemo = () => {
    setRequests(initialRequests);
    setSearch("");
    setStatusFilter("All");
    setSelectedId(null);
    setPaymentChoice({});
    setNotice("");
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
              <span className="font-semibold text-blue-700">
                Outlet Requests
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-700 p-3 text-white shadow-sm shadow-blue-200">
                <ClipboardList size={25} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Outlet Requests
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage outlet orders, product approvals and payment terms.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <RotateCcw size={16} />
            Reset Demo
          </button>
        </div>

        {/* Dashboard metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Requests"
            value={requests.length}
            icon={ClipboardList}
            description="All outlet requests"
          />
          <MetricCard
            label="Pending Approval"
            value={pendingCount}
            icon={Clock3}
            description="Products awaiting approval"
          />
          <MetricCard
            label="Awaiting Payment"
            value={awaitingCount}
            icon={CreditCard}
            description="Approval complete, payment pending"
          />
          <MetricCard
            label="Completed"
            value={completedCount}
            icon={CheckCircle2}
            description="Requests finalized"
          />
        </div>

        {/* Outstanding request value */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <Banknote size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Outstanding Request Value
              </p>
              <p className="mt-1 text-xl font-bold">{money(pendingValue)}</p>
            </div>
          </div>
          <p className="max-w-md text-xs leading-5 text-slate-500">
            Total value of requests not yet completed. This is an order value,
            not a live accounts receivable balance.
          </p>
        </div>

        {/* Requests table */}
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold">All Outlet Requests</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search requests and open their details to manage approvals.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search requests..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 sm:w-64"
                />
              </div>

              <div className="relative">
                <Filter
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 sm:w-48"
                >
                  <option value="All">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Awaiting Payment">Awaiting Payment</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50/70">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Request Details
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Outlet
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Requested On
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Products
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order Total
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedRequests.map((request) => {
                  const approved = getApprovedCount(request);
                  const progress =
                    (approved / request.products.length) * 100;

                  return (
                    <tr
                      key={request.id}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-5">
                        <p className="font-bold text-slate-900">
                          {request.id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.products.length} product(s)
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="max-w-[220px] truncate text-sm font-semibold">
                          {request.outletName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.ownerName}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="text-sm font-medium">
                          {formatDate(request.requestedAt)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatTime(request.requestedAt)}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {approved}/{request.products.length}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">
                          Approved
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="whitespace-nowrap text-sm font-bold">
                          {money(getTotal(request))}
                        </p>
                        {request.paymentType && (
                          <p className="mt-1 text-xs font-medium text-blue-700">
                            {request.paymentType}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={request.status} />
                      </td>

                      <td className="px-5 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => openDetails(request.id)}
                          className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-700 hover:bg-blue-700 hover:text-white"
                        >
                          <Eye size={16} />
                          View Details
                          <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paginatedRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <ClipboardList size={26} />
                      </div>
                      <p className="mt-4 font-semibold">No requests found</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or status filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("All");
                          setPage(1);
                        }}
                        className="mt-4 text-sm font-semibold text-blue-700 hover:underline"
                      >
                        Clear filters
                      </button>
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
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>
                {filteredRequests.length === 0
                  ? "0 results"
                  : `${(currentPage - 1) * pageSize + 1}–${Math.min(
                      currentPage * pageSize,
                      filteredRequests.length
                    )} of ${filteredRequests.length}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="min-w-20 text-center text-sm font-medium text-slate-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Request details modal */}
        {selectedRequest && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDetails();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="request-detail-title"
              className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            >
              {/* Modal header */}
              <div className="flex items-start justify-between gap-4 border-b border-blue-100 bg-white px-5 py-5 sm:px-7">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-blue-700 p-3 text-white">
                    <FileText size={23} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id="request-detail-title"
                        className="text-xl font-bold sm:text-2xl"
                      >
                        Request Details
                      </h2>
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Request ID: {selectedRequest.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                  aria-label="Close details"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable modal body */}
              <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/70 p-5 sm:p-7">
                {/* Outlet information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-white p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Store size={19} className="text-blue-700" />
                      <h3 className="font-bold">Outlet Information</h3>
                    </div>

                    <p className="text-lg font-bold">
                      {selectedRequest.outletName}
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-start gap-2.5 text-slate-600">
                        <UserRound
                          size={16}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />
                        <span>{selectedRequest.ownerName}</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-600">
                        <Phone
                          size={16}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />
                        <span>{selectedRequest.phone}</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-600">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />
                        <span>{selectedRequest.address}</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-slate-600">
                        <UserRound
                          size={16}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />
                        <span>{selectedRequest.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-white p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays size={19} className="text-blue-700" />
                      <h3 className="font-bold">Request Summary</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          Request ID
                        </span>
                        <span className="text-sm font-bold">
                          {selectedRequest.id}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          Request date
                        </span>
                        <span className="text-right text-sm font-semibold">
                          {formatDate(selectedRequest.requestedAt)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          Request time
                        </span>
                        <span className="text-sm font-semibold">
                          {formatTime(selectedRequest.requestedAt)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          Total products
                        </span>
                        <span className="text-sm font-semibold">
                          {selectedRequest.products.length}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-slate-500">
                          Approval progress
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          {getApprovedCount(selectedRequest)}/
                          {selectedRequest.products.length}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-blue-50">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${
                              (getApprovedCount(selectedRequest) /
                                selectedRequest.products.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product details table */}
                <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="flex items-center gap-2 font-bold">
                        <ShoppingBag size={19} className="text-blue-700" />
                        Requested Products
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Review each item and approve products individually.
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                      <CheckCircle2 size={15} />
                      {getApprovedCount(selectedRequest)} of{" "}
                      {selectedRequest.products.length} approved
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead>
                        <tr className="border-b border-blue-100 bg-blue-50/70">
                          <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Product
                          </th>
                          <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Quantity
                          </th>
                          <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Unit Price
                          </th>
                          <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Line Total
                          </th>
                          <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {selectedRequest.products.map((product) => (
                          <tr
                            key={`${selectedRequest.id}-${product.id}`}
                            className="hover:bg-blue-50/30"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                                  <Package size={19} />
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    {product.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    SKU: {product.sku}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {product.category}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold">
                                {product.quantity}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {product.unit}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-sm font-medium">
                              {money(product.price)}
                            </td>

                            <td className="px-4 py-4 text-sm font-bold">
                              {money(product.price * product.quantity)}
                            </td>

                            <td className="px-5 py-4 text-right">
                              {product.approved ? (
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800">
                                  <Check size={14} />
                                  Approved
                                </span>
                              ) : selectedRequest.status === "Pending" ? (
                                <button
                                  type="button"
                                  onClick={() => approveProduct(product.id)}
                                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
                                >
                                  <Check size={14} />
                                  Approve
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  Not approved
                                </span>
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
                      <span className="font-semibold">
                        {selectedRequest.products.reduce(
                          (sum, product) => sum + product.quantity,
                          0
                        )}{" "}
                        units
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-3">
                      <span className="font-bold">Grand Total</span>
                      <span className="text-xl font-bold text-blue-800">
                        {money(getTotal(selectedRequest))}
                      </span>
                    </div>
                  </div>

                  {selectedRequest.status === "Pending" && (
                    <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-5 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-semibold">Bulk approval</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Approve all remaining products in this request.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={approveAll}
                        disabled={allApproved}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <CheckCircle2 size={18} />
                        Approve All Products
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment selection appears only after every product is approved */}
                {allApproved && (
                  <div className="rounded-2xl border border-blue-200 bg-white p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-blue-100 p-3 text-blue-800">
                        <CreditCard size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">
                          Payment & Confirmation
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          All products are approved. Choose one payment type
                          for the entire request.
                        </p>
                      </div>
                    </div>

                    {selectedRequest.status === "Completed" ? (
                      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <p className="flex items-center gap-2 font-semibold text-blue-800">
                          <CheckCircle2 size={19} />
                          Request completed successfully
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm text-slate-600">
                            Selected payment type
                          </span>
                          <span className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-800">
                            {selectedRequest.paymentType}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentChoice((current) => ({
                                ...current,
                                [selectedRequest.id]: "Paid",
                              }))
                            }
                            className={`rounded-2xl border-2 p-5 text-left transition ${
                              paymentChoice[selectedRequest.id] === "Paid"
                                ? "border-blue-700 bg-blue-50 ring-4 ring-blue-50"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="rounded-xl bg-blue-100 p-3 text-blue-800">
                                <Banknote size={23} />
                              </div>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                  paymentChoice[selectedRequest.id] === "Paid"
                                    ? "border-blue-700 bg-blue-700 text-white"
                                    : "border-slate-300"
                                }`}
                              >
                                {paymentChoice[selectedRequest.id] ===
                                  "Paid" && <Check size={13} />}
                              </span>
                            </div>
                            <p className="mt-4 font-bold">Paid</p>
                            <p className="mt-1 text-sm text-slate-500">
                              Payment has been received.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPaymentChoice((current) => ({
                                ...current,
                                [selectedRequest.id]: "Credit",
                              }))
                            }
                            className={`rounded-2xl border-2 p-5 text-left transition ${
                              paymentChoice[selectedRequest.id] === "Credit"
                                ? "border-blue-700 bg-blue-50 ring-4 ring-blue-50"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="rounded-xl bg-blue-100 p-3 text-blue-800">
                                <CreditCard size={23} />
                              </div>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                  paymentChoice[selectedRequest.id] ===
                                  "Credit"
                                    ? "border-blue-700 bg-blue-700 text-white"
                                    : "border-slate-300"
                                }`}
                              >
                                {paymentChoice[selectedRequest.id] ===
                                  "Credit" && <Check size={13} />}
                              </span>
                            </div>
                            <p className="mt-4 font-bold">Credit</p>
                            <p className="mt-1 text-sm text-slate-500">
                              Payment will be collected later.
                            </p>
                          </button>
                        </div>

                        <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl bg-blue-50 p-4 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm text-slate-600">
                              Final order value
                            </p>
                            <p className="mt-1 text-2xl font-bold text-blue-900">
                              {money(getTotal(selectedRequest))}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={confirmRequest}
                            disabled={!paymentChoice[selectedRequest.id]}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <CheckCircle2 size={18} />
                            Confirm Request
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {notice && (
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p>{notice}</p>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex flex-col-reverse justify-between gap-3 border-t border-blue-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:px-7">
                <p className="text-xs text-slate-500">
                  {selectedRequest.status === "Completed"
                    ? `Completed with ${selectedRequest.paymentType} payment terms.`
                    : allApproved
                      ? "All products approved. Finish by selecting a payment type."
                      : "Approve all products before choosing payment terms."}
                </p>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50"
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
