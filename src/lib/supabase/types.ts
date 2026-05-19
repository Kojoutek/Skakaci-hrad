export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type Database = {
  public: {
    Tables: {
      castles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_per_day: number;
          purchase_price: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          price_per_day?: number;
          purchase_price?: number;
          active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price_per_day?: number;
          purchase_price?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          name: string;
          email: string;
          phone: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          castle_id: string;
          customer_id: string;
          status: ReservationStatus;
          total_deposit: number;
          note: string | null;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          castle_id: string;
          customer_id: string;
          status?: ReservationStatus;
          total_deposit: number;
          note?: string | null;
          admin_note?: string | null;
        };
        Update: {
          status?: ReservationStatus;
          total_deposit?: number;
          note?: string | null;
          admin_note?: string | null;
        };
        Relationships: [];
      };
      reservation_days: {
        Row: {
          id: string;
          reservation_id: string;
          day: string;
          created_at: string;
        };
        Insert: {
          reservation_id: string;
          day: string;
        };
        Update: {
          day?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          reservation_id: string;
          amount: number;
          note: string | null;
          paid_at: string;
        };
        Insert: {
          reservation_id: string;
          amount: number;
          note?: string | null;
        };
        Update: {
          amount?: number;
          note?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
