"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, UserCog, KeyRound } from "lucide-react";
import { staffService } from "@/services/staff";
import { StaffMember, Role } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/lib/auth";
import { Modal } from "@/components/shared/Modal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  receptionist: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

interface StaffForm {
  name: string;
  phone: string;
  email: string;
  role_id: string;
}

const emptyForm: StaffForm = { name: "", phone: "", email: "", role_id: "" };

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [visibleRoles, setVisibleRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [resetting, setResetting] = useState(false);
  const { showToast } = useToast();
  const { isOwner } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const [staffData, roles] = await Promise.all([
        staffService.getStaff(),
        staffService.getVisibleRoles(),
      ]);
      // Only show staff members whose role is visible
      setStaff(staffData.filter((m) => m.role?.is_visible !== false));
      setVisibleRoles(roles);
    } catch {
      showToast("Failed to load staff", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditMember(null);
    setForm({ ...emptyForm, role_id: visibleRoles[0]?.id ?? "" });
    setShowForm(true);
  };
  const openEdit = (m: StaffMember) => {
    setEditMember(m);
    setForm({ name: m.name, phone: m.phone, email: m.email ?? "", role_id: m.role_id });
    setShowForm(true);
  };

  const handleResetPassword = async () => {
    if (!resetTarget?.user_id) return;
    setResetting(true);
    try {
      await staffService.resetPassword(resetTarget.user_id);
      showToast(`Password reset to default for ${resetTarget.name}`, "success");
      setResetTarget(null);
    } catch {
      showToast("Failed to reset password", "error");
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast("Name and phone are required", "error");
      return;
    }
    if (!editMember && !form.email.trim()) {
      showToast("Email is required for new staff members", "error");
      return;
    }
    if (!form.role_id) {
      showToast("Please select a role", "error");
      return;
    }
    setSaving(true);
    try {
      if (editMember) {
        await staffService.updateStaff(editMember.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          role_id: form.role_id,
        });
        showToast("Staff member updated", "success");
      } else {
        await staffService.createStaff({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          role_id: form.role_id,
        });
        showToast("Staff member added", "success");
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save staff member", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await staffService.deactivateStaff(deactivateTarget.id);
      showToast("Staff member deactivated", "success");
      setDeactivateTarget(null);
      fetchData();
    } catch {
      showToast("Failed to deactivate staff member", "error");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your team</p>
          </div>
          <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-panel p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : staff.length === 0 ? (
            <div className="col-span-3 surface-panel p-12 text-center">
              <UserCog className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No staff members yet.</p>
            </div>
          ) : (
            staff.map((member) => (
              <div key={member.id} className="surface-panel p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 dark:text-blue-400 font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.phone}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[member.role?.name] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                    {member.role?.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(member)}
                    className="flex-1 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Edit
                  </button>
                  {isOwner && member.user_id && (
                    <button
                      onClick={() => setResetTarget(member)}
                      className="py-1.5 px-2 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                      title="Reset password to default"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {member.is_active && (
                    <button
                      onClick={() => setDeactivateTarget(member)}
                      className="flex-1 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editMember ? "Edit Staff Member" : "Add Staff Member"} maxWidth="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone <span className="text-red-500">*</span></label>
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email {!editMember && <span className="text-red-500">*</span>}</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required={!editMember} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {!editMember && <p className="text-xs text-gray-400 mt-1">A login account will be created with default password: default@123</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select value={form.role_id} onChange={(e) => setForm((p) => ({ ...p, role_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              {visibleRoles.map((role) => (
                <option key={role.id} value={role.id}>{role.name.charAt(0).toUpperCase() + role.name.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving..." : editMember ? "Update" : "Add Staff"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Staff Member"
        message={`Are you sure you want to deactivate "${deactivateTarget?.name}"?`}
        confirmLabel="Deactivate"
        loading={deactivating}
        variant="warning"
      />

      <ConfirmationDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPassword}
        title="Reset Password"
        message={`Reset password for "${resetTarget?.name}" to the default (default@123)?`}
        confirmLabel="Reset Password"
        loading={resetting}
        variant="warning"
      />
    </>
  );
}
