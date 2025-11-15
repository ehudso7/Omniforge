"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Home } from "lucide-react";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-xl"
          >
            <Home className="w-5 h-5" />
            OmniForge Studio
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <div className="font-medium">{user.name || "User"}</div>
              <div className="text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="btn btn-secondary flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
