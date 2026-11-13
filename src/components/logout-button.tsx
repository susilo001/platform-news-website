"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
export function LogoutButton() {
  return (
    <button
      className="icon-button"
      title="Sign out"
      aria-label="Sign out"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut size={17} />
    </button>
  );
}
