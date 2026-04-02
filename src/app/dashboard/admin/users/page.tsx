"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";
import { updateUserRole, updateUserStatus, updateUserCredits, createUserDocument, UserProfile } from "@/lib/firestore/users";
import { createAdminLog } from "@/lib/firestore/adminLogs";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export default function AdminUsersPage() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { users, loading, loadMore, hasMore, refresh } = useAdminUsers(20);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editCredits, setEditCredits] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "user" as "user" | "admin" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && (!currentUser || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [currentUser, isAdmin, authLoading, router]);

  const handleRoleChange = async (uid: string, newRole: "user" | "admin") => {
    try {
      await updateUserRole(uid, newRole);
      if (currentUser) {
        await createAdminLog(
          currentUser.uid,
          currentUser.displayName || currentUser.email || "Admin",
          "UPDATE_ROLE",
          "users",
          uid,
          `Changed role to ${newRole}`,
          "committed"
        );
      }
      refresh();
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleStatusChange = async (uid: string, newStatus: "active" | "suspended") => {
    try {
      await updateUserStatus(uid, newStatus);
      if (currentUser) {
        await createAdminLog(
          currentUser.uid,
          currentUser.displayName || currentUser.email || "Admin",
          "UPDATE_STATUS",
          "users",
          uid,
          `Changed status to ${newStatus}`,
          "committed"
        );
      }
      refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleCreditsUpdate = async () => {
    if (!editingUser || !editCredits) return;
    
    const credits = parseInt(editCredits);
    if (isNaN(credits)) return;

    try {
      await updateUserCredits(editingUser.uid, credits);
      if (currentUser) {
        await createAdminLog(
          currentUser.uid,
          currentUser.displayName || currentUser.email || "Admin",
          "UPDATE_CREDITS",
          "users",
          editingUser.uid,
          `Updated credits to ${credits}`,
          "committed"
        );
      }
      refresh();
      setEditingUser(null);
      setEditCredits("");
    } catch (error) {
      console.error("Failed to update credits:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) return;
    
    setCreating(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;
      
      await createUserDocument(uid, {
        email: newUser.email,
        displayName: newUser.name,
        photoURL: null,
        role: newUser.role,
        credits: 10,
        plan: "free",
        deviceQuota: 3,
        status: "active",
        lastActiveAt: null,
      });
      
      if (currentUser) {
        await createAdminLog(
          currentUser.uid,
          currentUser.displayName || currentUser.email || "Admin",
          "CREATE_USER",
          "users",
          uid,
          `Created new user: ${newUser.email}`,
          "committed"
        );
      }
      
      setShowCreateModal(false);
      setNewUser({ email: "", password: "", name: "", role: "user" });
      refresh();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      alert(error.message || "Failed to create user");
    }
    setCreating(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.displayName || u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (authLoading || !currentUser || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-10 flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-[10px] font-mono tracking-[0.3em] text-primary uppercase">Admin Control</h2>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface">User Management</h1>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Add User
        </button>
      </header>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm pl-12 pr-4 py-3 text-on-surface placeholder:text-white/40 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <section className="bg-white/[0.02] border border-dashed border-white/10 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Credits</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Joined</th>
              <th className="text-left px-6 py-4 text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-white/40">Loading users...</td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-on-surface font-medium">{u.displayName || "User"}</p>
                      <p className="text-white/40 text-sm">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as "user" | "admin")}
                      className={`px-2 py-1 text-[10px] font-mono uppercase rounded-sm border-none cursor-pointer ${
                        u.role === "admin" ? "bg-[#67d7dd]/20 text-[#67d7dd]" : "bg-white/10 text-white/60"
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { setEditingUser(u); setEditCredits(u.credits?.toString() || "0"); }}
                      className="text-on-surface font-mono hover:text-primary transition-colors"
                    >
                      {u.credits || 0}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.status || "active"}
                      onChange={(e) => handleStatusChange(u.uid, e.target.value as "active" | "suspended")}
                      className={`px-2 py-1 text-[10px] font-mono uppercase rounded-sm border-none cursor-pointer ${
                        (u.status || "active") === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-white/40 text-sm font-mono">
                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { setEditingUser(u); setEditCredits(u.credits?.toString() || "0"); }}
                      className="p-2 text-white/40 hover:text-primary transition-colors" 
                      title="Edit Credits"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-white/40">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {hasMore && (
        <div className="flex items-center justify-center mt-8">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#2D2D2D] border border-[#3C3C3C] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-on-surface mb-4">Edit Credits</h3>
            <div className="mb-4">
              <label className="text-xs font-mono text-on-surface-variant uppercase">User</label>
              <p className="text-on-surface">{editingUser.email}</p>
            </div>
            <div className="mb-6">
              <label className="text-xs font-mono text-on-surface-variant uppercase">Credits</label>
              <input
                type="number"
                value={editCredits}
                onChange={(e) => setEditCredits(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded px-4 py-2 text-on-surface font-mono"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingUser(null); setEditCredits(""); }}
                className="flex-1 px-4 py-2 border border-white/10 text-white/60 rounded hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditsUpdate}
                className="flex-1 px-4 py-2 bg-primary text-on-primary font-bold rounded hover:brightness-110 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#2D2D2D] border border-[#3C3C3C] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-on-surface mb-4">Add New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded px-4 py-2 text-on-surface"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded px-4 py-2 text-on-surface"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded px-4 py-2 text-on-surface"
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono text-on-surface-variant uppercase">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as "user" | "admin"})}
                  className="w-full bg-[#1E1E1E] border border-[#3C3C3C] rounded px-4 py-2 text-on-surface"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-white/10 text-white/60 rounded hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary text-on-primary font-bold rounded hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}