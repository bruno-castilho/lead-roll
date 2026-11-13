/**
 * Tipos mínimos do banco, escritos à mão a partir de
 * `supabase/migrations/*.sql`. Atualize junto com a migration
 * (ou gere com `npx supabase gen types typescript`).
 */
export type UserRoleEnum = "manager" | "broker";
export type LeadStageEnum =
  | "new"
  | "contacted"
  | "visit_scheduled"
  | "proposal"
  | "won"
  | "lost";
export type LeadSourceEnum =
  | "site"
  | "whatsapp"
  | "instagram"
  | "referral"
  | "portal"
  | "campaign"
  | "other";
export type LeadInterestEnum =
  | "buy"
  | "rent"
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "other";

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
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          source: LeadSourceEnum;
          interest: LeadInterestEnum;
          stage: LeadStageEnum;
          broker_id: string | null;
          created_at: string;
          assigned_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          source: LeadSourceEnum;
          interest: LeadInterestEnum;
          stage?: LeadStageEnum;
          broker_id?: string | null;
          created_at?: string;
          assigned_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          source?: LeadSourceEnum;
          interest?: LeadInterestEnum;
          stage?: LeadStageEnum;
          broker_id?: string | null;
          created_at?: string;
          assigned_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_broker_id_fkey";
            columns: ["broker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_observations: {
        Row: {
          id: string;
          lead_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          author_id?: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_observations_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_observations_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_manager: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRoleEnum;
      lead_stage: LeadStageEnum;
      lead_source: LeadSourceEnum;
      lead_interest: LeadInterestEnum;
    };
    CompositeTypes: Record<never, never>;
  };
}
