"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, UserCog } from "lucide-react";
import { staffService } from "@/services/staff";
import { StaffMember, UserRole } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/shared/Modal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  receptionist: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const emptyForm = { name: "", phone: "", email: "", role: "receptionist" as UserRole };

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { showToast } = useToast();

  const fetchStaff = useCallback(async () => {
    try {
      const data = await staffService.getStaff();
      setStaff(data);
    } catch {
      showToast("Failed to load staff", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const openAdd = () => { setEditMember(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (m: StaffMember) => {
    setEditMember(m);
    setForm({ name: m.name, phone: m.phone, email: m.email ?? "", role: m.role });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast("Name and phone are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        role: form.role,
        is_active: true,
      };
      if (editMember) {
        await staffService.updateStaff(editMember.id, payload);
        showToast("Staff member updated", "success");
      } else {
        await staffService.createStaff(payload);
        showToast("Staff member added", "success");
      }
      setShowForm(false);
      fetchStaff();
    } catch {
      showToast("Failed to save staff member", "error");
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
      fetchStaff();
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[member.role] ?? ""}`}>
                    {member.role}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(member)}
                    className="flex-1 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Edit
                  </button>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="receptionist">Receptionist</option>
              <option value="owner">Owner</option>
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
    </>
  );
}
