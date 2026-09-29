// src/pages/admin/AdminUsersPage.jsx
//
// Light-themed to match the rest of your admin panel (sidebar, dashboard,
// analytics page) — no dark: variants, since the admin section doesn't
// actually use dark mode.

import { useState } from "react";
import { toast } from "react-toastify";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Loader2,
  Shield,
  RefreshCw,
} from "lucide-react";
import {
  useGetUsersQuery,
  useEnableUserMutation,
  useDisableUserMutation,
} from "../../services/api/userApi";

export default function AdminUsersPage() {
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUsersQuery();
  const [enableUser] = useEnableUserMutation();
  const [disableUser] = useDisableUserMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // 'ALL' | 'ACTIVE' | 'DISABLED'
  const [busyUuid, setBusyUuid] = useState(null);

  const handleToggleStatus = async (user) => {
    setBusyUuid(user.uuid);
    try {
      if (user.disabled) {
        await enableUser(user.uuid).unwrap();
        toast.success(`${user.username || user.email} enabled`);
      } else {
        await disableUser(user.uuid).unwrap();
        toast.success(`${user.username || user.email} disabled`);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Action failed");
    } finally {
      setBusyUuid(null);
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => !u.disabled && !u.isDeleted).length;
  const disabledUsers = users.filter((u) => u.disabled && !u.isDeleted).length;

  const filteredUsers = users.filter((user) => {
    const fullName =
      `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(query) || email.includes(query);
    if (!matchesSearch) return false;

    if (filterStatus === "ACTIVE") return !user.disabled;
    if (filterStatus === "DISABLED") return user.disabled;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
        <p className="text-red-500 font-bold mb-1">
          Failed to load users from backend API.
        </p>
        <p className="text-xs text-neutral-400 mb-4">
          {error?.status
            ? `Server returned HTTP ${error.status}`
            : "Unknown error"}
        </p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
          Manage Users
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          View and manage active and disabled user accounts.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Users
            </p>
            <p className="text-2xl font-black text-neutral-900">{totalUsers}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Active Users
            </p>
            <p className="text-2xl font-black text-emerald-600">
              {activeUsers}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Disabled Accounts
            </p>
            <p className="text-2xl font-black text-amber-600">
              {disabledUsers}
            </p>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200 w-full sm:w-auto">
          {[
            { label: "All Users", key: "ALL" },
            { label: "Active", key: "ACTIVE" },
            { label: "Disabled", key: "DISABLED" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filterStatus === tab.key
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-400 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 pl-6">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Points</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-neutral-400">
                  No users found matching your search.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isBusy = busyUuid === user.uuid;
                return (
                  <tr
                    key={user.uuid}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-bold text-neutral-900 leading-snug">
                        {user.firstName || ""} {user.lastName || ""}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {user.email || "No email"}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-700">
                        <Shield className="w-3 h-3 text-red-500" />
                        {user.role || "USER"}
                      </span>
                    </td>

                    <td className="p-4 text-xs font-medium text-neutral-600">
                      {user.phone || "—"}
                    </td>

                    <td className="p-4 font-bold text-neutral-900">
                      {user.points ?? 0}
                    </td>

                    <td className="p-4">
                      {user.disabled ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <button
                        disabled={isBusy}
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center justify-center min-w-[82px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          user.disabled
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : user.disabled ? (
                          "Enable"
                        ) : (
                          "Disable"
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
