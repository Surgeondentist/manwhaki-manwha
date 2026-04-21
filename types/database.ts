/**
 * Tipos alineados con `supabase/schema.sql`.
 * Cuando el esquema crezca, puedes regenerarlos con:
 * `npx supabase gen types typescript --project-id <id> > types/database.gen.ts`
 */

export type ComicStatus = "ongoing" | "completed";
export type LibraryStatus = "reading" | "dropped" | "completed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      comics: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          author_name: string | null;
          status: ComicStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          cover_url?: string | null;
          author_name?: string | null;
          status?: ComicStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          cover_url?: string | null;
          author_name?: string | null;
          status?: ComicStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      chapters: {
        Row: {
          id: string;
          comic_id: string;
          chapter_number: number;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          comic_id: string;
          chapter_number: number;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          comic_id?: string;
          chapter_number?: number;
          title?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chapters_comic_id_fkey";
            columns: ["comic_id"];
            isOneToOne: false;
            referencedRelation: "comics";
            referencedColumns: ["id"];
          },
        ];
      };
      chapter_pages: {
        Row: {
          id: string;
          chapter_id: string;
          page_number: number;
          image_url: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          page_number: number;
          image_url: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          page_number?: number;
          image_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chapter_pages_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
        ];
      };
      library: {
        Row: {
          user_id: string;
          comic_id: string;
          status: LibraryStatus;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          comic_id: string;
          status?: LibraryStatus;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          comic_id?: string;
          status?: LibraryStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "library_comic_id_fkey";
            columns: ["comic_id"];
            isOneToOne: false;
            referencedRelation: "comics";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      comic_status: ComicStatus;
      library_item_status: LibraryStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** Filas usadas en listados (evita `never` por desajuste fino con el genérico del cliente). */
export type ComicListItem = Pick<
  Tables<"comics">,
  "id" | "title" | "description" | "cover_url" | "author_name" | "status" | "created_at"
>;

export type ChapterListItem = Pick<
  Tables<"chapters">,
  "id" | "chapter_number" | "title" | "created_at"
>;

export type ChapterPageItem = Pick<
  Tables<"chapter_pages">,
  "page_number" | "image_url"
>;
