/**
 * Tipos mínimos do banco, escritos à mão a partir de
 * `supabase/migrations/*_profiles.sql`. Atualize junto com a migration
 * (ou gere com `npx supabase gen types typescript`).
 */
export type UserRoleEnum = "manager" | "broker";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: UserRoleEnum;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: UserRoleEnum;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: UserRoleEnum;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_manager: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: { user_role: UserRoleEnum };
    CompositeTypes: Record<never, never>;
  };
}
