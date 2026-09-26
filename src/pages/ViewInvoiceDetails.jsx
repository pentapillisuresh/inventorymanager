import React from 'react';

const ViewInvoiceDetails = ({ invoice }) => {
  if (!invoice) {
    return (
      <div className="p-4 text-center">
        Invoice details not found.
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Invoice Details</h4>
          <span className="text-muted">
            Invoice #{invoice.invoiceNumber}
          </span>
        </div>

        <span
          className={`badge ${
            invoice.status === "completed"
              ? "bg-success"
              : "bg-warning text-dark"
          }`}
        >
          {invoice.status}
        </span>
      </div>

      {/* Invoice Information */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Invoice Information</h5>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="text-muted">Invoice Number</label>
              <div className="fw-semibold">
                {invoice.invoiceNumber || "-"}
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <label className="text-muted">Batch ID</label>
              <div className="fw-semibold">
                {invoice.batchID || "-"}
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <label className="text-muted">Invoice Type</label>
              <div className="fw-semibold">
                {invoice.type || "-"}
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <label className="text-muted">Invoice Date</label>
              <div className="fw-semibold">
                {formatDate(invoice.invoiceDate)}
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <label className="text-muted">Created At</label>
              <div className="fw-semibold">
                {formatDate(invoice.createdAt)}
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <label className="text-muted">Payment Method</label>
              <div className="fw-semibold text-capitalize">
                {invoice.paymentMethod || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Information */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Store Information</h5>
        </div>

        <div className="card-body">
          {invoice.Store ? (
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="text-muted">Store Name</label>
                <div className="fw-semibold">
                  {invoice.Store.name || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Phone Number</label>
                <div className="fw-semibold">
                  {invoice.Store.phoneNumber || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Email</label>
                <div className="fw-semibold">
                  {invoice.Store.email || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Address</label>
                <div className="fw-semibold">
                  {invoice.Store.address || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">GST Number</label>
                <div className="fw-semibold">
                  {invoice.Store.GST_No || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">FSSAI Number</label>
                <div className="fw-semibold">
                  {invoice.Store.FSSAI_No || "-"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted mb-0">
              Store information not available.
            </p>
          )}
        </div>
      </div>

      {/* Outlet Information */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Outlet Information</h5>
        </div>

        <div className="card-body">
          {invoice.Outlet ? (
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="text-muted">Outlet Name</label>
                <div className="fw-semibold">
                  {invoice.Outlet.name || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Outlet Type</label>
                <div className="fw-semibold text-capitalize">
                  {invoice.Outlet.type || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Contact Person</label>
                <div className="fw-semibold">
                  {invoice.Outlet.contactPerson || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Phone Number</label>
                <div className="fw-semibold">
                  {invoice.Outlet.phoneNumber || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Address</label>
                <div className="fw-semibold">
                  {invoice.Outlet.address || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">GST Number</label>
                <div className="fw-semibold">
                  {invoice.Outlet.GST_No || "-"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted mb-0">
              Outlet information not available.
            </p>
          )}
        </div>
      </div>

      {/* Store Manager */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Store Manager</h5>
        </div>

        <div className="card-body">
          {invoice.StoreManager ? (
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="text-muted">Name</label>
                <div className="fw-semibold">
                  {invoice.StoreManager.name || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Email</label>
                <div className="fw-semibold">
                  {invoice.StoreManager.email || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Manager ID</label>
                <div className="fw-semibold">
                  {invoice.StoreManager.id || "-"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted mb-0">
              Store manager information not available.
            </p>
          )}
        </div>
      </div>

      {/* Payment Information */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Payment Information</h5>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="text-muted">Total Amount</label>
              <div className="fs-5 fw-bold">
                {formatAmount(invoice.totalAmount)}
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <label className="text-muted">Paid Amount</label>
              <div className="fs-5 fw-bold text-success">
                {formatAmount(invoice.paidAmount)}
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <label className="text-muted">Credit Amount</label>
              <div className="fs-5 fw-bold text-danger">
                {formatAmount(invoice.creditAmount)}
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <label className="text-muted">Payment Status</label>
              <div>
                <span className="badge bg-success">
                  {invoice.paymentMethod || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Information */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Admin Information</h5>
        </div>

        <div className="card-body">
          {invoice.Admin ? (
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="text-muted">Admin ID</label>
                <div className="fw-semibold">
                  {invoice.Admin.id || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Name</label>
                <div className="fw-semibold">
                  {invoice.Admin.name || "-"}
                </div>
              </div>

              <div className="col-md-4 mb-3">
                <label className="text-muted">Email</label>
                <div className="fw-semibold">
                  {invoice.Admin.email || "-"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted mb-0">
              Admin information not available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewInvoiceDetails;