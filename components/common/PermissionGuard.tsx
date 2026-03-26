
"use client";

import React, { useEffect, useState } from "react";
import { authService } from "../../services/auth.service";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import BMSLoader from "./BMSLoader";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  roles?: string[];
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  permissions,
  roles,
  children,
}: PermissionGuardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-12">
        <BMSLoader message="Verifying permissions..." />
      </div>
    );
  }

  let hasPermission = true;

  if (permission) {
    hasPermission = authService.hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasPermission = authService.hasAnyPermission(permissions);
  }

  // Role check (if specified, user must have at least one of the roles)
  if (hasPermission && roles && roles.length > 0) {
    hasPermission = roles.some((role) => authService.hasRole(role));
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
          You don't have the required permissions to access this page. If you
          believe this is an error, please contact your administrator.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium shadow-sm shadow-blue-500/20"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
