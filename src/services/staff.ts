import { getSupabaseClient } from "@/lib/supabase";
import { StaffMember } from "@/lib/types";

export const staffService = {
  async getStaff(): Promise<StaffMember[]> {
    const { data, error } = await getSupabaseClient()
      .from("staff")
      .select("*")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },

  async getStaffById(id: string): Promise<StaffMember | null> {
    const { data, error } = await getSupabaseClient()
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async createStaff(
    member: Omit<StaffMember, "id" | "created_at">
  ): Promise<StaffMember> {
    const { data, error } = await getSupabaseClient()
      .from("staff")
      .insert(member)
      .select()
      .single();
    if (error) throw error;
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
};
