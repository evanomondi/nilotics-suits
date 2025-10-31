"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: users, error, mutate } = useSWR("/api/users", fetcher);

  const roleLabels: Record<string, string> = {
    OWNER: "Owner",
    OPS: "Operations",
    EU_TAILOR: "EU Tailor",
    KE_TAILOR: "KE Tailor",
    QC: "Quality Control",
  };

  const roleColors: Record<string, string> = {
    OWNER: "bg-purple-100 text-purple-700",
    OPS: "bg-blue-100 text-blue-700",
    EU_TAILOR: "bg-green-100 text-green-700",
    KE_TAILOR: "bg-teal-100 text-teal-700",
    QC: "bg-orange-100 text-orange-700",
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Failed to load users. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-gray-500 text-sm">
              {users ? `${users.length} users` : "Loading..."}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        {!users ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No users found. Add your first user!
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Region
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {user.name || "No name"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          roleColors[user.role] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.region || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {user.verified ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <UserCheck className="w-4 h-4" />
                          Verified
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <UserX className="w-4 h-4" />
                          Not verified
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note: Create/Edit modals would go here */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Create User</h2>
            <p className="text-gray-600 text-sm mb-4">
              User creation is typically handled via NextAuth registration flow.
              This is a placeholder for future implementation.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
