// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Search,
//   Eye,
//   X,
//   Package,
//   Clock,
//   CheckCircle,
//   XCircle,
//   ClipboardList,
// } from "lucide-react";

// import {
//   getAdminCustomOrders,
//   updateCustomOrderStatus,
// } from "../../services/adminService";

// import "./AdminCustomOrders.css";

// const AdminCustomOrders = () => {
//   const navigate = useNavigate();

//   const [orders, setOrders] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");

//   const [selectedOrder, setSelectedOrder] = useState(null);

//   const [updatingStatus, setUpdatingStatus] = useState(false);
//   const [previewImage, setPreviewImage] = useState(null);
//   // ==================== LOAD ====================

//   const loadOrders = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await getAdminCustomOrders();

//       setOrders(response.custom_orders || response.orders || []);
//     } catch (err) {
//       console.error("Custom order loading error:", err);

//       if (err.response?.status === 401 || err.response?.status === 403) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         navigate("/login");
//         return;
//       }

//       setError(err.response?.data?.message || "Failed to load custom orders");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadOrders();
//   }, []);

//   // ==================== HELPERS ====================

//   const formatDate = (date) => {
//     if (!date) return "-";

//     const value = new Date(date);

//     if (Number.isNaN(value.getTime())) {
//       return date;
//     }

//     return value.toLocaleString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const formatPrice = (price) => {
//     if (price === null || price === undefined || price === "") {
//       return "-";
//     }

//     const value = Number(price);

//     if (!Number.isFinite(value)) {
//       return "-";
//     }

//     return `₹${value.toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })}`;
//   };

//   const getStatusClass = (status) => {
//     const value = String(status || "").toLowerCase();

//     if (
//       value === "completed" ||
//       value === "delivered" ||
//       value === "approved"
//     ) {
//       return "completed";
//     }

//     if (value === "cancelled" || value === "rejected") {
//       return "cancelled";
//     }

//     if (value === "processing" || value === "in_progress") {
//       return "processing";
//     }

//     return "pending";
//   };

//   const getStatusLabel = (status) => {
//     if (!status) return "Pending";

//     return String(status)
//       .replaceAll("_", " ")
//       .replace(/\b\w/g, (char) => char.toUpperCase());
//   };

//   // ==================== FILTER ====================

//   const filteredOrders = useMemo(() => {
//     return orders.filter((order) => {
//       const searchText = search.toLowerCase();

//       const matchesSearch =
//         String(order.id || "")
//           .toLowerCase()
//           .includes(searchText) ||
//         order.customer?.name?.toLowerCase().includes(searchText) ||
//         order.customer?.email?.toLowerCase().includes(searchText) ||
//         order.customer?.phone?.toLowerCase().includes(searchText) ||
//         order.title?.toLowerCase().includes(searchText) ||
//         order.description?.toLowerCase().includes(searchText);

//       const orderStatus = String(order.status || "pending").toLowerCase();

//       const matchesStatus =
//         statusFilter === "all" || orderStatus === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [orders, search, statusFilter]);

//   // ==================== COUNTS ====================

//   const totalCount = orders.length;

//   const pendingCount = orders.filter(
//     (order) => String(order.status || "pending").toLowerCase() === "pending",
//   ).length;

//   const processingCount = orders.filter(
//     (order) => String(order.status || "").toLowerCase() === "processing",
//   ).length;

//   const completedCount = orders.filter((order) =>
//     ["completed", "delivered", "approved"].includes(
//       String(order.status || "").toLowerCase(),
//     ),
//   ).length;

//   // ==================== VIEW ====================

//   const handleViewOrder = (order) => {
//     setSelectedOrder(order);
//     setError("");
//     setSuccess("");
//   };

//   const closeOrderModal = () => {
//     setSelectedOrder(null);
//   };

//   // ==================== STATUS ====================

//   const handleStatusChange = async (order, newStatus) => {
//     try {
//       setUpdatingStatus(true);
//       setError("");
//       setSuccess("");

//       const response = await updateCustomOrderStatus(order.id, newStatus);

//       const updatedOrder = response.custom_order ||
//         response.order || {
//           ...order,
//           status: newStatus,
//         };

//       setOrders((previous) =>
//         previous.map((item) =>
//           item.id === order.id
//             ? {
//                 ...item,
//                 ...updatedOrder,
//                 status: newStatus,
//               }
//             : item,
//         ),
//       );

//       setSelectedOrder((previous) =>
//         previous
//           ? {
//               ...previous,
//               ...updatedOrder,
//               status: newStatus,
//             }
//           : previous,
//       );

//       setSuccess("Custom order status updated successfully");
//     } catch (err) {
//       console.error("Custom order status error:", err);

//       if (err.response?.status === 401 || err.response?.status === 403) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         navigate("/login");
//         return;
//       }

//       setError(err.response?.data?.message || "Failed to update order status");
//     } finally {
//       setUpdatingStatus(false);
//     }
//   };

//   // ==================== UI ====================

//   return (
//     <div className="admin-custom-orders-page">
//       {/* HEADER */}

//       <div className="admin-custom-orders-header">
//         <div>
//           <h1>Custom Orders</h1>

//           <p>Manage customer custom order requests and their status.</p>
//         </div>
//       </div>

//       {error && <div className="custom-order-alert error">{error}</div>}

//       {success && <div className="custom-order-alert success">{success}</div>}

//       {/* SUMMARY */}

//       <div className="custom-order-summary-grid">
//         <div className="custom-order-summary-card">
//           <div className="custom-order-summary-icon">
//             <ClipboardList size={20} />
//           </div>

//           <div>
//             <span>Total Requests</span>
//             <strong>{totalCount}</strong>
//           </div>
//         </div>

//         <div className="custom-order-summary-card">
//           <div className="custom-order-summary-icon">
//             <Clock size={20} />
//           </div>

//           <div>
//             <span>Pending</span>
//             <strong>{pendingCount}</strong>
//           </div>
//         </div>

//         <div className="custom-order-summary-card">
//           <div className="custom-order-summary-icon">
//             <Package size={20} />
//           </div>

//           <div>
//             <span>Processing</span>
//             <strong>{processingCount}</strong>
//           </div>
//         </div>

//         <div className="custom-order-summary-card">
//           <div className="custom-order-summary-icon">
//             <CheckCircle size={20} />
//           </div>

//           <div>
//             <span>Completed</span>
//             <strong>{completedCount}</strong>
//           </div>
//         </div>
//       </div>

//       {/* FILTER */}

//       <div className="custom-order-filter-bar">
//         <div className="custom-order-search">
//           <Search size={18} />

//           <input
//             type="text"
//             placeholder="Search customer, email, phone or order..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         <select
//           className="custom-order-status-filter"
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//         >
//           <option value="all">All Status</option>

//           <option value="pending">Pending</option>

//           <option value="processing">Processing</option>

//           <option value="approved">Approved</option>

//           <option value="completed">Completed</option>

//           <option value="delivered">Delivered</option>

//           <option value="rejected">Rejected</option>

//           <option value="cancelled">Cancelled</option>
//         </select>
//       </div>

//       {/* TABLE */}

//       <div className="custom-order-table-card">
//         {loading ? (
//           <div className="custom-order-loading">Loading custom orders...</div>
//         ) : filteredOrders.length === 0 ? (
//           <div className="custom-order-empty">
//             <ClipboardList size={42} />

//             <h3>No custom orders found</h3>

//             <p>Customer custom order requests will appear here.</p>
//           </div>
//         ) : (
//           <div className="custom-order-table-wrapper">
//             <table className="custom-order-table">
//               <thead>
//                 <tr>
//                   <th>Order</th>
//                   <th>Customer</th>
//                   <th>Request</th>
//                   <th>Date</th>
//                   <th>Status</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredOrders.map((order) => (
//                   <tr key={order.id}>
//                     <td>
//                       <strong className="custom-order-id">#{order.id}</strong>
//                     </td>

//                     <td>
//                       <div className="custom-order-customer">
//                         <strong>{order.customer?.name || "Customer"}</strong>

//                         {order.customer?.email && (
//                           <span>{order.customer?.email}</span>
//                         )}

//                         {order.customer?.phone && (
//                           <span>{order.customer?.phone}</span>
//                         )}
//                       </div>
//                     </td>

//                     <td>
//                       <div className="custom-order-request">
//                         <strong>{order.title || "Custom Request"}</strong>

//                         <span>{order.description || "-"}</span>
//                       </div>
//                     </td>

//                     <td>{formatDate(order.created_at)}</td>

//                     <td>
//                       <select
//                         className={`custom-order-status-select ${getStatusClass(
//                           order.status,
//                         )}`}
//                         value={order.status || "pending"}
//                         onChange={(e) =>
//                           handleStatusChange(order, e.target.value)
//                         }
//                         disabled={updatingStatus}
//                       >
//                         <option value="pending">Pending</option>

//                         <option value="processing">Processing</option>

//                         <option value="approved">Approved</option>

//                         <option value="completed">Completed</option>

//                         <option value="delivered">Delivered</option>

//                         <option value="rejected">Rejected</option>

//                         <option value="cancelled">Cancelled</option>
//                       </select>
//                     </td>

//                     <td>
//                       <button
//                         className="custom-order-view-btn"
//                         onClick={() => handleViewOrder(order)}
//                         title="View details"
//                       >
//                         <Eye size={16} />
//                         View
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* DETAILS MODAL */}

//       {selectedOrder && (
//         <div className="custom-order-modal-overlay">
//           <div className="custom-order-modal">
//             <div className="custom-order-modal-header">
//               <div>
//                 <h2>Custom Order #{selectedOrder.id}</h2>

//                 <p>Customer custom order details</p>
//               </div>

//               <button
//                 className="custom-order-modal-close"
//                 onClick={closeOrderModal}
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="custom-order-details">
//               <div className="custom-order-detail-section">
//                 <h3>Customer</h3>

//                 <div className="custom-order-detail-grid">
//                   <div>
//                     <span>Name</span>
//                     <strong>{selectedOrder.customer?.name || "-"}</strong>
//                   </div>

//                   <div>
//                     <span>Email</span>
//                     <strong>{selectedOrder.customer?.email || "-"}</strong>
//                   </div>

//                   <div>
//                     <span>Phone</span>
//                     <strong>{selectedOrder.customer?.phone || "-"}</strong>
//                   </div>
//                 </div>
//               </div>

//               <div className="custom-order-detail-section">
//                 <h3>Request Details</h3>

//                 <div className="custom-order-detail-grid">
//                   <div>
//                     <span>Title</span>
//                     <strong>{selectedOrder.title || "-"}</strong>
//                   </div>

//                   <div>
//                     <span>Created</span>
//                     <strong>{formatDate(selectedOrder.created_at)}</strong>
//                   </div>

//                   <div>
//                     <span>Status</span>
//                     <strong>{getStatusLabel(selectedOrder.status)}</strong>
//                   </div>
//                 </div>
//               </div>

//               <div className="custom-order-detail-section">
//                 <h3>Description</h3>

//                 <p className="custom-order-description">
//                   {selectedOrder.description || "No description provided."}
//                 </p>
//               </div>

//               <div className="custom-order-detail-section">
//                 <h3>Customization Details</h3>

//                 <p className="custom-order-description">
//                   {selectedOrder.customization_details ||
//                     "No customization details provided."}
//                 </p>
//               </div>

//               <div className="custom-order-detail-section">
//                 <h3>Order Information</h3>

//                 <div className="custom-order-detail-grid">
//                   <div>
//                     <span>Quantity</span>
//                     <strong>{selectedOrder.quantity ?? "-"}</strong>
//                   </div>

//                   <div>
//                     <span>Estimated Price</span>
//                     <strong>
//                       {formatPrice(selectedOrder.estimated_price)}
//                     </strong>
//                   </div>
//                 </div>
//               </div>

//               {/* {selectedOrder.reference_image_url && (
//                 <div className="custom-order-detail-section">
//                   <h3>Reference Image</h3>

//                   <img
//                     src={selectedOrder.reference_image_url}
//                     alt="Custom order reference"
//                     style={{
//                       display: "block",
//                       maxWidth: "100%",
//                       maxHeight: "320px",
//                       objectFit: "contain",
//                     }}
//                   />
//                 </div>
//               )} */}

              
// {selectedOrder.reference_image_url && (
//   <div className="custom-order-detail-section">
//     <h3>Reference Image</h3>

//     <img
//       src={selectedOrder.reference_image_url}
//       alt="Custom order reference"
//       className="custom-order-reference-image"
//       onClick={() =>
//         setPreviewImage(selectedOrder.reference_image_url)
//       }
//       title="Click to view full image"
//     />

//     <p className="image-preview-hint">
//       Click image to view full size
//     </p>
//   </div>
// )}


//               {selectedOrder.admin_notes && (
//                 <div className="custom-order-detail-section">
//                   <h3>Admin Notes</h3>

//                   <p className="custom-order-description">
//                     {selectedOrder.admin_notes}
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminCustomOrders;




import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  X,
  Package,
  Clock,
  CheckCircle,
  ClipboardList,
} from "lucide-react";

import {
  getAdminCustomOrders,
  updateCustomOrderStatus,
} from "../../services/adminService";

import "./AdminCustomOrders.css";

const AdminCustomOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // ==================== LOAD ====================

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminCustomOrders();
      setOrders(response.custom_orders || response.orders || []);
    } catch (err) {
      console.error("Custom order loading error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to load custom orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // ==================== HELPERS ====================


const formatDate = (date) => {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "-";
    }

    const value = Number(price);

    if (!Number.isFinite(value)) {
      return "-";
    }

    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (
      value === "completed" ||
      value === "delivered" ||
      value === "approved"
    ) {
      return "completed";
    }

    if (value === "cancelled" || value === "rejected") {
      return "cancelled";
    }

    if (value === "processing" || value === "in_progress") {
      return "processing";
    }

    return "pending";
  };

  const getStatusLabel = (status) => {
    if (!status) return "Pending";

    return String(status)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ==================== FILTER ====================

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        String(order.id || "")
          .toLowerCase()
          .includes(searchText) ||
        order.customer?.name?.toLowerCase().includes(searchText) ||
        order.customer?.email?.toLowerCase().includes(searchText) ||
        order.customer?.phone?.toLowerCase().includes(searchText) ||
        order.title?.toLowerCase().includes(searchText) ||
        order.description?.toLowerCase().includes(searchText);

      const orderStatus = String(order.status || "pending").toLowerCase();

      const matchesStatus =
        statusFilter === "all" || orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // ==================== COUNTS ====================

  const totalCount = orders.length;

  const pendingCount = orders.filter(
    (order) => String(order.status || "pending").toLowerCase() === "pending"
  ).length;

  const processingCount = orders.filter(
    (order) => String(order.status || "").toLowerCase() === "processing"
  ).length;

  const completedCount = orders.filter((order) =>
    ["completed", "delivered", "approved"].includes(
      String(order.status || "").toLowerCase()
    )
  ).length;

  // ==================== VIEW ====================

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setPreviewImage(null);
    setError("");
    setSuccess("");
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setPreviewImage(null);
  };

  // ==================== STATUS ====================

  const handleStatusChange = async (order, newStatus) => {
    try {
      setUpdatingStatus(true);
      setError("");
      setSuccess("");

      const response = await updateCustomOrderStatus(order.id, newStatus);

      const updatedOrder = response.custom_order ||
        response.order || {
          ...order,
          status: newStatus,
        };

      setOrders((previous) =>
        previous.map((item) =>
          item.id === order.id
            ? {
                ...item,
                ...updatedOrder,
                status: newStatus,
              }
            : item
        )
      );

      setSelectedOrder((previous) =>
        previous
          ? {
              ...previous,
              ...updatedOrder,
              status: newStatus,
            }
          : previous
      );

      setSuccess("Custom order status updated successfully");
    } catch (err) {
      console.error("Custom order status error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to update order status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==================== UI ====================

  return (
    <div className="admin-custom-orders-page">
      {/* HEADER */}

      <div className="admin-custom-orders-header">
        <div>
          <h1>Custom Orders</h1>
          <p>Manage customer custom order requests and their status.</p>
        </div>
      </div>

      {error && <div className="custom-order-alert error">{error}</div>}
      {success && <div className="custom-order-alert success">{success}</div>}

      {/* SUMMARY */}

      <div className="custom-order-summary-grid">
        <div className="custom-order-summary-card">
          <div className="custom-order-summary-icon">
            <ClipboardList size={20} />
          </div>
          <div>
            <span>Total Requests</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <div className="custom-order-summary-card">
          <div className="custom-order-summary-icon">
            <Clock size={20} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="custom-order-summary-card">
          <div className="custom-order-summary-icon">
            <Package size={20} />
          </div>
          <div>
            <span>Processing</span>
            <strong>{processingCount}</strong>
          </div>
        </div>

        <div className="custom-order-summary-card">
          <div className="custom-order-summary-icon">
            <CheckCircle size={20} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </div>
      </div>

      {/* FILTER */}

      <div className="custom-order-filter-bar">
        <div className="custom-order-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search customer, email, phone or order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="custom-order-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* TABLE */}

      <div className="custom-order-table-card">
        {loading ? (
          <div className="custom-order-loading">
            Loading custom orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="custom-order-empty">
            <ClipboardList size={42} />
            <h3>No custom orders found</h3>
            <p>Customer custom order requests will appear here.</p>
          </div>
        ) : (
          <div className="custom-order-table-wrapper">
            <table className="custom-order-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Request</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong className="custom-order-id">
                        #{order.id}
                      </strong>
                    </td>

                    <td>
                      <div className="custom-order-customer">
                        <strong>{order.customer?.name || "Customer"}</strong>

                        {order.customer?.email && (
                          <span>{order.customer.email}</span>
                        )}

                        {order.customer?.phone && (
                          <span>{order.customer.phone}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="custom-order-request">
                        <strong>{order.title || "Custom Request"}</strong>
                        <span>{order.description || "-"}</span>
                      </div>
                    </td>

                    <td>{formatDate(order.created_at)}</td>

                    <td>
                      <select
                        className={`custom-order-status-select ${getStatusClass(
                          order.status
                        )}`}
                        value={order.status || "pending"}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value)
                        }
                        disabled={updatingStatus}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td>
                      <button
                        className="custom-order-view-btn"
                        onClick={() => handleViewOrder(order)}
                        title="View details"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}

      {selectedOrder && (
        <div className="custom-order-modal-overlay">
          <div className="custom-order-modal">
            <div className="custom-order-modal-header">
              <div>
                <h2>Custom Order #{selectedOrder.id}</h2>
                <p>Customer custom order details</p>
              </div>

              <button
                className="custom-order-modal-close"
                onClick={closeOrderModal}
                aria-label="Close order details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="custom-order-details">
              <div className="custom-order-detail-section">
                <h3>Customer</h3>

                <div className="custom-order-detail-grid">
                  <div>
                    <span>Name</span>
                    <strong>{selectedOrder.customer?.name || "-"}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{selectedOrder.customer?.email || "-"}</strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>{selectedOrder.customer?.phone || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="custom-order-detail-section">
                <h3>Request Details</h3>

                <div className="custom-order-detail-grid">
                  <div>
                    <span>Title</span>
                    <strong>{selectedOrder.title || "-"}</strong>
                  </div>

                  <div>
                    <span>Created</span>
                    <strong>{formatDate(selectedOrder.created_at)}</strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>{getStatusLabel(selectedOrder.status)}</strong>
                  </div>
                </div>
              </div>

              <div className="custom-order-detail-section">
                <h3>Description</h3>
                <p className="custom-order-description">
                  {selectedOrder.description || "No description provided."}
                </p>
              </div>

              <div className="custom-order-detail-section">
                <h3>Customization Details</h3>
                <p className="custom-order-description">
                  {selectedOrder.customization_details ||
                    "No customization details provided."}
                </p>
              </div>

              <div className="custom-order-detail-section">
                <h3>Order Information</h3>

                <div className="custom-order-detail-grid">
                  <div>
                    <span>Quantity</span>
                    <strong>{selectedOrder.quantity ?? "-"}</strong>
                  </div>

                  <div>
                    <span>Estimated Price</span>
                    <strong>
                      {formatPrice(selectedOrder.estimated_price)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* REFERENCE IMAGE */}

              {selectedOrder.reference_image_url && (
                <div className="custom-order-detail-section">
                  <h3>Reference Image</h3>

                  <img
                    src={selectedOrder.reference_image_url}
                    alt="Custom order reference"
                    className="custom-order-reference-image"
                    onClick={() =>
                      setPreviewImage(selectedOrder.reference_image_url)
                    }
                    title="Click to view full image"
                  />

                  <p className="image-preview-hint">
                    Click image to view full size
                  </p>
                </div>
              )}

              {selectedOrder.admin_notes && (
                <div className="custom-order-detail-section">
                  <h3>Admin Notes</h3>
                  <p className="custom-order-description">
                    {selectedOrder.admin_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE PREVIEW */}

      {previewImage && (
        <div
          className="custom-image-lightbox"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="custom-image-close"
            onClick={() => setPreviewImage(null)}
            aria-label="Close image preview"
          >
            <X size={28} />
          </button>

          <img
            src={previewImage}
            alt="Full-size custom order reference"
            className="custom-image-full"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminCustomOrders;
