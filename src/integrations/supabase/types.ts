export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
          visible: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          order_id: string;
          product_id: string | null;
          product_image: string | null;
          product_kind: Database["public"]["Enums"]["product_kind"] | null;
          product_name: string;
          quantity: number;
          size: string | null;
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_image?: string | null;
          product_kind?: Database["public"]["Enums"]["product_kind"] | null;
          product_name: string;
          quantity: number;
          size?: string | null;
          unit_price: number;
          variant_id?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_image?: string | null;
          product_kind?: Database["public"]["Enums"]["product_kind"] | null;
          product_name?: string;
          quantity?: number;
          size?: string | null;
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string;
          city: string;
          country: string;
          created_at: string;
          delivery_type: Database["public"]["Enums"]["delivery_type"] | null;
          email: string | null;
          full_name: string;
          id: string;
          need_gift_box: boolean;
          notes: string | null;
          order_number: string;
          payment_intent_id: string | null;
          payment_method: string;
          payment_proof_content_type: string | null;
          payment_proof_name: string | null;
          payment_proof_path: string | null;
          payment_proof_size: number | null;
          payment_rejection_reason: string | null;
          payment_reviewed_at: string | null;
          payment_reviewed_by: string | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          phone: string | null;
          postal_code: string | null;
          shipping: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          success_token_hash: string | null;
          tax: number;
          total: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address: string;
          city: string;
          country?: string;
          created_at?: string;
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null;
          email?: string | null;
          full_name: string;
          id?: string;
          need_gift_box?: boolean;
          notes?: string | null;
          order_number?: string;
          payment_intent_id?: string | null;
          payment_method?: string;
          payment_proof_content_type?: string | null;
          payment_proof_name?: string | null;
          payment_proof_path?: string | null;
          payment_proof_size?: number | null;
          payment_rejection_reason?: string | null;
          payment_reviewed_at?: string | null;
          payment_reviewed_by?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          phone?: string | null;
          postal_code?: string | null;
          shipping?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          success_token_hash?: string | null;
          tax?: number;
          total: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address?: string;
          city?: string;
          country?: string;
          created_at?: string;
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          need_gift_box?: boolean;
          notes?: string | null;
          order_number?: string;
          payment_intent_id?: string | null;
          payment_method?: string;
          payment_proof_content_type?: string | null;
          payment_proof_name?: string | null;
          payment_proof_path?: string | null;
          payment_proof_size?: number | null;
          payment_rejection_reason?: string | null;
          payment_reviewed_at?: string | null;
          payment_reviewed_by?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          phone?: string | null;
          postal_code?: string | null;
          shipping?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          success_token_hash?: string | null;
          tax?: number;
          total?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_payment_intent_id_fkey";
            columns: ["payment_intent_id"];
            isOneToOne: false;
            referencedRelation: "payment_upload_intents";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_upload_intents: {
        Row: {
          claim_token_hash: string;
          consumed_at: string | null;
          consumed_order_id: string | null;
          created_at: string;
          declared_mime: string;
          expected_size: number;
          expires_at: string;
          id: string;
          object_path: string;
          original_filename: string;
        };
        Insert: {
          claim_token_hash: string;
          consumed_at?: string | null;
          consumed_order_id?: string | null;
          created_at?: string;
          declared_mime: string;
          expected_size: number;
          expires_at: string;
          id?: string;
          object_path?: string;
          original_filename: string;
        };
        Update: {
          claim_token_hash?: string;
          consumed_at?: string | null;
          consumed_order_id?: string | null;
          created_at?: string;
          declared_mime?: string;
          expected_size?: number;
          expires_at?: string;
          id?: string;
          object_path?: string;
          original_filename?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_upload_intents_consumed_order_fk";
            columns: ["consumed_order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          available: boolean;
          color: string | null;
          color_ar: string | null;
          created_at: string;
          id: string;
          product_id: string;
          size: string | null;
          size_ar: string | null;
          updated_at: string;
        };
        Insert: {
          available?: boolean;
          color?: string | null;
          color_ar?: string | null;
          created_at?: string;
          id?: string;
          product_id: string;
          size?: string | null;
          size_ar?: string | null;
          updated_at?: string;
        };
        Update: {
          available?: boolean;
          color?: string | null;
          color_ar?: string | null;
          created_at?: string;
          id?: string;
          product_id?: string;
          size?: string | null;
          size_ar?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          available: boolean;
          badge: string | null;
          brand_id: string;
          category: Database["public"]["Enums"]["product_category"] | null;
          colors: string[];
          created_at: string;
          description_ar: string | null;
          description_en: string | null;
          display_color: string | null;
          id: string;
          image: string;
          images: string[];
          is_best_seller: boolean;
          is_new_arrival: boolean;
          kind: Database["public"]["Enums"]["product_kind"];
          name_ar: string | null;
          name_en: string;
          old_price: number | null;
          price: number;
          rating: number;
          reviews: number;
          sizes: string[];
          slug: string;
          stock: number;
          updated_at: string;
          visible: boolean;
        };
        Insert: {
          active?: boolean;
          available?: boolean;
          badge?: string | null;
          brand_id: string;
          category?: Database["public"]["Enums"]["product_category"] | null;
          colors?: string[];
          created_at?: string;
          description_ar?: string | null;
          description_en?: string | null;
          display_color?: string | null;
          id?: string;
          image: string;
          images?: string[];
          is_best_seller?: boolean;
          is_new_arrival?: boolean;
          kind?: Database["public"]["Enums"]["product_kind"];
          name_ar?: string | null;
          name_en: string;
          old_price?: number | null;
          price?: number;
          rating?: number;
          reviews?: number;
          sizes?: string[];
          slug: string;
          stock?: number;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          active?: boolean;
          available?: boolean;
          badge?: string | null;
          brand_id?: string;
          category?: Database["public"]["Enums"]["product_category"] | null;
          colors?: string[];
          created_at?: string;
          description_ar?: string | null;
          description_en?: string | null;
          display_color?: string | null;
          id?: string;
          image?: string;
          images?: string[];
          is_best_seller?: boolean;
          is_new_arrival?: boolean;
          kind?: Database["public"]["Enums"]["product_kind"];
          name_ar?: string | null;
          name_en?: string;
          old_price?: number | null;
          price?: number;
          rating?: number;
          reviews?: number;
          sizes?: string[];
          slug?: string;
          stock?: number;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          admin_order_emails_enabled: boolean;
          bank_account_name: string;
          bank_account_number: string;
          bank_instructions: string;
          bank_name: string;
          id: number;
          updated_at: string;
          video_enabled: boolean;
          video_poster_url: string | null;
          video_url: string | null;
        };
        Insert: {
          admin_order_emails_enabled?: boolean;
          bank_account_name?: string;
          bank_account_number?: string;
          bank_instructions?: string;
          bank_name?: string;
          id?: number;
          updated_at?: string;
          video_enabled?: boolean;
          video_poster_url?: string | null;
          video_url?: string | null;
        };
        Update: {
          admin_order_emails_enabled?: boolean;
          bank_account_name?: string;
          bank_account_number?: string;
          bank_instructions?: string;
          bank_name?: string;
          id?: number;
          updated_at?: string;
          video_enabled?: boolean;
          video_poster_url?: string | null;
          video_url?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      commit_checkout_order_v2: {
        Args: {
          p_address: string;
          p_city: string;
          p_country: string;
          p_delivery_type: Database["public"]["Enums"]["delivery_type"];
          p_email: string;
          p_full_name: string;
          p_items: Json;
          p_notes: string;
          p_phone: string;
          p_postal_code: string;
          p_shipping: number;
          p_subtotal: number;
          p_total: number;
          p_user_id: string;
        };
        Returns: {
          id: string;
          order_number: string;
          shipping: number;
          subtotal: number;
          tax: number;
          total: number;
        }[];
      };
      commit_checkout_order_v3: {
        Args: {
          p_address: string;
          p_city: string;
          p_country: string;
          p_delivery_type: Database["public"]["Enums"]["delivery_type"];
          p_email: string;
          p_full_name: string;
          p_items: Json;
          p_notes: string;
          p_payment_claim_hash: string;
          p_payment_intent_id: string;
          p_phone: string;
          p_postal_code: string;
          p_shipping: number;
          p_subtotal: number;
          p_success_token_hash: string;
          p_total: number;
          p_user_id: string;
        };
        Returns: {
          id: string;
          order_number: string;
          shipping: number;
          subtotal: number;
          tax: number;
          total: number;
        }[];
      };
      commit_checkout_order_v4: {
        Args: {
          p_address: string;
          p_city: string;
          p_country: string;
          p_delivery_type: Database["public"]["Enums"]["delivery_type"];
          p_full_name: string;
          p_items: Json;
          p_notes: string;
          p_payment_claim_hash: string;
          p_payment_intent_id: string;
          p_phone: string;
          p_postal_code: string;
          p_shipping: number;
          p_subtotal: number;
          p_success_token_hash: string;
          p_total: number;
          p_user_id: string;
        };
        Returns: {
          id: string;
          order_number: string;
          shipping: number;
          subtotal: number;
          tax: number;
          total: number;
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "customer";
      delivery_type: "home" | "office";
      order_status:
        "awaiting_payment" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";
      payment_status:
        "awaiting_payment" | "proof_submitted" | "payment_verified" | "payment_rejected";
      product_category:
        | "necklace"
        | "bracelet"
        | "ring"
        | "earrings"
        | "pendant"
        | "watch"
        | "bangle"
        | "anklet"
        | "handcuff";
      product_kind: "jewelry" | "ring_box" | "general_box";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      delivery_type: ["home", "office"],
      order_status: [
        "awaiting_payment",
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: [
        "awaiting_payment",
        "proof_submitted",
        "payment_verified",
        "payment_rejected",
      ],
      product_category: [
        "necklace",
        "bracelet",
        "ring",
        "earrings",
        "pendant",
        "watch",
        "bangle",
        "anklet",
        "handcuff",
      ],
      product_kind: ["jewelry", "ring_box", "general_box"],
    },
  },
} as const;
