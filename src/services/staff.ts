import { getSupabaseClient } from "@/lib/supabase";
import { StaffMember, Role } from "@/lib/types";

export const staffService = {
  async getRoles(): Promise<Role[]> {
    const { data, error } = await getSupabaseClient()
      .from("roles")
      .select("*")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },

  async getVisibleRoles(): Promise<Role[]> {
    const { data, error } = await getSupabaseClient()
      .from("roles")
      .select("*")
      .eq("is_visible", true)
      .order("name");
    if (error) throw error;
    return data ?? [];
  },

  async getStaff(): Promise<StaffMember[]> {
    const { data, error } = await getSupabaseClient()
      .from("staff")
      .select("*, role:roles(*)")
      .order("name");
    if (error) throw error;
    return (data ?? []) as StaffMember[];
  },

  async getStaffById(id: string): Promise<StaffMember | null> {
    const { data, error } = await getSupabaseClient()
      .from("staff")
      .select("*, role:roles(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as StaffMember | null;
  },

  async createStaff(
    member: { name: string; phone: string; email?: string; role_id: string }
  ): Promise<StaffMember> {
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create staff member");
    return data;
  },

  async updateStaff(id: string, updates: Partial<StaffMember>): Promise<StaffMember> {
    const { data, error } = await getSupabaseClient()
      .from("staff")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deactivateStaff(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("staff")
      .update({ is_active: false })
      .eq("id", id);
    if (error) throw error;
  },

  async resetPassword(userId: string): Promise<void> {
    const res = await fetch("/api/staff/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reset password");
  },

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await getSupabaseClient().auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};
