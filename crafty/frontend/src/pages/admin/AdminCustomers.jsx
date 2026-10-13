import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  X,
  Users,
  User,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getAdminUsers,
  updateAdminUserRole,
} from "../../services/adminService";

import "./AdminCustomers.css";


function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function formatDateTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatRole(role) {
  if (!role) return "-";

  return String(role)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}


export default function AdminCustomers() {

  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);

  const [updatingRole, setUpdatingRole] = useState(null);


  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = async (showLoader = true) => {

    try {

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await getAdminUsers();

      const userList = response?.users ?? [];

      setUsers(
        Array.isArray(userList)
          ? userList
          : []
      );

    } catch (err) {

      console.error(
        "ADMIN CUSTOMERS ERROR:",
        err
      );

      if (err.response?.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
          state: {
            from: "/admin/customers",
          },
        });

        return;
      }

      if (err.response?.status === 403) {

        setError(
          "You do not have admin permission."
        );

        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to load customers."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  useEffect(() => {
    loadUsers();
  }, []);


  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredUsers = useMemo(() => {

    const searchValue =
      search.trim().toLowerCase();

    return users.filter((user) => {

      const matchesSearch =
        !searchValue ||
        String(user.id || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.email || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(user.phone || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        String(user.role || "")
          .toLowerCase() ===
          roleFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesRole
      );

    });

  }, [users, search, roleFilter]);


  // =========================================================
  // UPDATE ROLE
  // =========================================================

  const handleRoleChange = async (
    userId,
    newRole
  ) => {

    try {

      setUpdatingRole(userId);

      const response =
        await updateAdminUserRole(
          userId,
          newRole
        );

      const updatedUser =
        response?.user;

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? updatedUser || {
                ...user,
                role: newRole,
              }
            : user
        )
      );

      if (
        selectedUser?.id === userId
      ) {

        setSelectedUser(
          updatedUser || {
            ...selectedUser,
            role: newRole,
          }
        );

      }

    } catch (err) {

      console.error(
        "UPDATE USER ROLE ERROR:",
        err
      );

      alert(
        err.response?.data?.message ||
        "Failed to update user role."
      );

    } finally {

      setUpdatingRole(null);

    }
  };


  // =========================================================
  // SUMMARY
  // =========================================================

  const totalUsers = users.length;

  const totalCustomers = users.filter(
    (user) =>
      String(user.role)
        .toLowerCase() === "customer"
  ).length;

  const totalAdmins = users.filter(
    (user) =>
      String(user.role)
        .toLowerCase() === "admin"
  ).length;


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <div className="admin-customers-page">

        <div className="admin-customers-loading">

          <RefreshCw
            size={30}
            className="spin"
          />

          <p>
            Loading customers...
          </p>

        </div>

      </div>
    );

  }


  return (
    <div className="admin-customers-page">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="admin-customers-header">

        <div>

          <button
            className="admin-back-button"
            onClick={() =>
              navigate("/admin/dashboard")
            }
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <h1>
            Customers
          </h1>

          <p>
            View and manage registered
            customers and users.
          </p>

        </div>


        <button
          className="admin-refresh-button"
          onClick={() =>
            loadUsers(false)
          }
          disabled={refreshing}
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>


      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (

        <div className="admin-customers-error">

          <XCircle size={18} />

          {error}

        </div>

      )}


      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      <div className="admin-customer-summary">

        <div className="admin-customer-summary-card">

          <div className="summary-icon">
            <Users size={21} />
          </div>

          <div>

            <span>
              Total Users
            </span>

            <strong>
              {totalUsers}
            </strong>

          </div>

        </div>


        <div className="admin-customer-summary-card">

          <div className="summary-icon">
            <UserRound size={21} />
          </div>

          <div>

            <span>
              Customers
            </span>

            <strong>
              {totalCustomers}
            </strong>

          </div>

        </div>


        <div className="admin-customer-summary-card">

          <div className="summary-icon">
            <ShieldCheck size={21} />
          </div>

          <div>

            <span>
              Admins
            </span>

            <strong>
              {totalAdmins}
            </strong>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* TOOLBAR */}
      {/* ================================================= */}

      <div className="admin-customers-toolbar">

        <div className="admin-customer-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search by name, email, phone or ID..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <select
          className="admin-customer-filter"
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(
              event.target.value
            )
          }
        >

          <option value="all">
            All roles
          </option>

          <option value="customer">
            Customers
          </option>

          <option value="admin">
            Admins
          </option>

        </select>

      </div>


      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="admin-customers-table-wrapper">

        <table className="admin-customers-table">

          <thead>

            <tr>

              <th>
                User
              </th>

              <th>
                Contact
              </th>

              <th>
                Role
              </th>

              <th>
                Joined
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredUsers.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  className="admin-customers-empty"
                >

                  <Users size={35} />

                  <strong>
                    No users found
                  </strong>

                  <span>
                    Try changing your
                    search or filter.
                  </span>

                </td>

              </tr>

            ) : (

              filteredUsers.map(
                (user) => (

                  <tr key={user.id}>

                    {/* USER */}

                    <td>

                      <div className="customer-user-cell">

                        <div className="customer-avatar">
                          <User size={16} />
                        </div>

                        <div>

                          <strong>
                            {user.name ||
                              "Unnamed User"}
                          </strong>

                          <small>
                            ID: #{user.id}
                          </small>

                        </div>

                      </div>

                    </td>


                    {/* CONTACT */}

                    <td>

                      <div className="customer-contact">

                        <div>
                          <Mail size={14} />
                          <span>
                            {user.email ||
                              "-"}
                          </span>
                        </div>

                        <div>
                          <Phone size={14} />
                          <span>
                            {user.phone ||
                              "-"}
                          </span>
                        </div>

                      </div>

                    </td>


                    {/* ROLE */}

                    <td>

                      <select
                        className={`customer-role-select ${
                          String(
                            user.role
                          ).toLowerCase()
                        }`}
                        value={
                          user.role ||
                          "customer"
                        }
                        disabled={
                          updatingRole ===
                          user.id
                        }
                        onChange={(event) =>
                          handleRoleChange(
                            user.id,
                            event.target.value
                          )
                        }
                      >

                        <option value="customer">
                          Customer
                        </option>

                        <option value="admin">
                          Admin
                        </option>

                      </select>

                    </td>


                    {/* JOINED */}

                    <td>

                      <div className="customer-date">

                        <CalendarDays
                          size={15}
                        />

                        <span>
                          {formatDate(
                            user.created_at
                          )}
                        </span>

                      </div>

                    </td>


                    {/* ACTION */}

                    <td>

                      <button
                        className="view-customer-button"
                        onClick={() =>
                          setSelectedUser(
                            user
                          )
                        }
                      >

                        <Eye size={16} />

                        View

                      </button>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>


      {/* ================================================= */}
      {/* CUSTOMER DETAILS MODAL */}
      {/* ================================================= */}

      {selectedUser && (

        <div
          className="admin-customer-modal-overlay"
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className="admin-customer-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-customer-modal-header">

              <div>

                <span>
                  Customer details
                </span>

                <h2>
                  {selectedUser.name ||
                    "User"}
                </h2>

              </div>


              <button
                className="modal-close-button"
                onClick={() =>
                  setSelectedUser(null)
                }
              >

                <X size={20} />

              </button>

            </div>


            <div className="admin-customer-modal-body">

              <div className="customer-profile-icon">
                <User size={30} />
              </div>


              <div className="customer-detail-section">

                <h3>
                  <User size={17} />
                  Basic Information
                </h3>


                <div className="customer-detail-grid">

                  <div>
                    <span>
                      User ID
                    </span>

                    <strong>
                      #{selectedUser.id}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Role
                    </span>

                    <strong>
                      {formatRole(
                        selectedUser.role
                      )}
                    </strong>
                  </div>

                </div>

              </div>


              <div className="customer-detail-section">

                <h3>
                  <Mail size={17} />
                  Contact Information
                </h3>


                <div className="customer-detail-grid">

                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {selectedUser.email ||
                        "-"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {selectedUser.phone ||
                        "-"}
                    </strong>
                  </div>

                </div>

              </div>


              <div className="customer-detail-section">

                <h3>
                  <CalendarDays size={17} />
                  Account Information
                </h3>


                <div className="customer-detail-grid">

                  <div>
                    <span>
                      Joined
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedUser.created_at
                      )}
                    </strong>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}