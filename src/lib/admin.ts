/**
 * Helper to check if a user has admin access.
 * Uses both environment variable whitelist (secure) and database role flags.
 */
export function isAdmin(email?: string, role?: string): boolean {
  if (!email) return false;

  const whitelistString = process.env.ADMIN_EMAILS || "admin@theprofessor.xyz,cutef@theprofessor.xyz";
  const whitelist = whitelistString.split(",").map(e => e.trim().toLowerCase());

  if (whitelist.includes(email.toLowerCase())) {
    return true;
  }

  return role?.toLowerCase() === "admin";
}
