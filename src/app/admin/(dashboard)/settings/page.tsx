"use client";

import { useState, useEffect } from "react";
import { Save, Download, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/context/ToastContext";
import { settingsService } from "@/services/settings";
import { staffService } from "@/services/staff";
import { exportSalesReport } from "@/lib/backup";
import { PhoneInput } from "@/components/shared/PhoneInput";

export default function SettingsPage() {
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [currency, setCurrency] = useState("LKR");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupDate, setBackupDate] = useState("");
  const [exportingBackup, setExportingBackup] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const { showToast } = useToast();
  const { isOwner } = useAuth();

  useEffect(() => {
    settingsService.getSettings().then((s) => {
      if (s) {
        setShopName(s.shop_name);
        setPhone(s.phone);
        setPhone2(s.phone2 ?? "");
        setEmail(s.email ?? "");
        setAddress(s.address ?? "");
        setTaxRate(String(s.tax_rate));
        setCurrency(s.currency);
        setLowStockThreshold(String(s.low_stock_threshold));
      }
    }).catch(() => { }).finally(() => setLoading(false));

    // Default backup date to today
    setBackupDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.saveSettings({
        shop_name: shopName,
        phone,
        phone2: phone2 || undefined,
        email: email || undefined,
        address: address || undefined,
        tax_rate: Number(taxRate),
        currency,
        low_stock_threshold: Number(lowStockThreshold),
      });
      showToast("Settings saved successfully", "success");
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleManualBackup = async () => {
    setExportingBackup(true);
    try {
      await exportSalesReport(backupDate);
      showToast(`Sales backup for ${backupDate} downloaded`, "success");
    } catch {
      showToast("Backup failed. No sales may exist for this date.", "error");
    } finally {
      setExportingBackup(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    setChangingPassword(true);
    try {
      await staffService.changePassword(newPassword);
      showToast("Password changed successfully", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Failed to change password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface-panel p-6 h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your shop settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {isOwner && (
          <>
            {/* Shop Info */}
            <div className="surface-panel p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Shop Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop Name</label>
                <input value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="My Spare Parts Shop" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone 1</label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    placeholder="770 460 529"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone 2</label>
                  <PhoneInput
                    value={phone2}
                    onChange={setPhone2}
                    placeholder="740 800 274"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            {/* Billing */}
            <div className="surface-panel p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Billing & Inventory</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="LKR">LKR – Rs.</option>
                    <option value="USD">USD – $</option>
                    <option value="EUR">EUR – €</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
                  <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min="0" max="100" step="0.1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Alert At</label>
                  <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} min="1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </>
        )}
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="surface-panel p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={changingPassword}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          <Lock className="w-4 h-4" />
          {changingPassword ? "Changing..." : "Change Password"}
        </button>
      </form>

      {/* Backup */}
      {isOwner && (
        <div className="surface-panel p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Backup Sales Data</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daily backups are automatically exported on dashboard load. You can also manually download a backup for any date.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={backupDate}
              onChange={(e) => setBackupDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleManualBackup}
              disabled={exportingBackup || !backupDate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exportingBackup ? "Exporting..." : "Download Backup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
