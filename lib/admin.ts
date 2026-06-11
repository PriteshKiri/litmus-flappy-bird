import crypto from "crypto";

export const ADMIN_COOKIE = "cb_admin";

// Fixed local credentials (overridable via env). No Supabase auth involved.
export function getAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL || "admin@litmuschaos.io").toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "litmus@123Chaos",
  };
}

export function checkCredentials(email: string, password: string): boolean {
  const c = getAdminCredentials();
  return email.trim().toLowerCase() === c.email && password === c.password;
}

// Deterministic session token derived from the credentials + a secret.
// Stored in an httpOnly cookie; verified server-side before destructive actions.
export function expectedToken(): string {
  const c = getAdminCredentials();
  const secret = process.env.ADMIN_SESSION_SECRET || "chaosbird-admin-secret";
  return crypto.createHash("sha256").update(`${c.email}:${c.password}:${secret}`).digest("hex");
}
