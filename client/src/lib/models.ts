export type UserRole = "buyer" | "seller" | "admin";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  country: string | null;
  role: UserRole | null;
  account_status: "active" | "suspended" | "banned" | null;
};

export type Beat = {
  id: string;
  seller_id: string;
  title: string;
  slug: string;
  description: string | null;
  producer: string | null;
  genre: string | null;
  subgenre: string | null;
  bpm: number | null;
  musical_key: string | null;
  mood: string | null;
  cover_image_url: string | null;
  preview_url: string | null;
  master_url: string | null;
  price: number | null;
  is_free: boolean | null;
  license_info: string | null;
  status: "draft" | "published" | "archived" | "removed" | null;
  play_count: number | null;
  favorite_count: number | null;
  download_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  cover_url?: string | null;
  preview_signed_url?: string | null;
};

export type BeatLicense = {
  id: string;
  beat_id: string;
  license_code: "basic" | "premium" | "exclusive";
  name: string;
  price: number;
  terms: string | null;
  is_available: boolean;
};

export type Category = { id: string; name: string; slug: string };
