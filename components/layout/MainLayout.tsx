"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ThemeProvider, useTheme } from "../../contexts/ThemeContext";
import { BranchProvider } from "../../contexts/BranchContext";
import { LoadingProvider } from "../../contexts/LoadingContext";
import { LoadingOverlay } from "../common/LoadingOverlay";
import { NavigationLoader } from "../common/NavigationLoader";
import BMSLoader from "../common/BMSLoader";
import { usePathname, useRouter } from "next/navigation";
import { authService, User } from '../../services/auth.service';
import { useQueryClient } from '@tanstack/react-query';
import { branchService } from '../../services/branch.service';
import { centerService } from '../../services/center.service';
import { MaintenanceGuard } from '../maintenance/MaintenanceGuard';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { PermissionGuard } from "../common/PermissionGuard";

export type Page =
  | "dashboard"
  | "admin-dashboard"
  | "branches"
  | "centers"
  | "groups"
  | "customers"
  | "loan-create"
  | "loan-approval"
  | "loan-sent-back"
  | "loan-list"
  | "loan-product"
  | "due-list"
  | "collections"
  | "collection-summary"
  | "reports"
  | "finance"
  | "finance-overview"
  | "fund-transactions"
  | "branch-transactions"
  | "fund-truncation-summary"
  | "fund-truncation-parent"
  | "investments"
  | "investment-create"
  | "investment-list"
  | "staff-management"
  | "roles-privileges"
  | "shareholders"
  | "complaints"
  | "system-config"
  | "documents"
  | "public-website"
  | "center-requests"
  | "receipt-rejections"
  | "salary-approval"
  | "bank-branch-approval"

  | "staff-promotion"
  | "promotion-approval"
  | "temporary-promotion"
  | "profile"
  | "staff-directory"
  | "staff-loan-create"
  | "staff-loan-approval"
  | "staff-loan-list"
  | "loan-agreement"
  | "loan-activation"
  | "loan-card"
  | "loan-dino"
  | "loan-cancellation"
  | "loan-cancellation-approval"
  | "disbursement-queue"
  | "repayment"
  | "investment-agreement"
  | "reprint-approvals"
  | "ip-whitelisting"
  | "security-settings"
  | "device-management"
  | "backup-system"
  | "system-test"
  | "maintenance-mode"
  | "audit-logs"
  | "login-logs"
  | "modification-logs"
  | "cashier-branch-activity"
  | "cashier-temp-cashier"
  | "cashier-receipts"
  | "cashier-branch-activity-request"
  | "cashier-other-branch-collection"
  | "cashier-staff-request"
  | "investment-approvals"
  | "investment-activation"
  | "investment-reprint-requests"
  | "investment-payments"
  | "system-config-staff-expense-categories"
  | "system-config-gs-divisions"
  | string;




function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<{
    name: string;
    role: string;
    roleSlug?: string;
    role_name?: string;
    branch: string;
    avatar_url?: string;
    staff_id?: string;
    user_name?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [securityVersion, setSecurityVersion] = useState(0);

  const refreshUser = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const storedRolesStr = localStorage.getItem("roles");
      let userRole = currentUser.role;

      if (storedRolesStr) {
        try {
          const roles = JSON.parse(storedRolesStr);
          if (Array.isArray(roles) && roles.length > 0) {
            userRole = roles[0].name;
          }
        } catch (e) {
          console.error("Failed to parse roles", e);
        }
      }

      setUser({
        name: currentUser.full_name || currentUser.name,
        role: currentUser.role_name || userRole || "Staff",
        roleSlug: userRole,
        branch: currentUser.branch?.branch_name || currentUser.branch?.name || "Head Office",
        avatar_url: currentUser.avatar_url,
        staff_id: currentUser.staff_id,
        user_name: currentUser.user_name,
      });
      // Increment version to force re-renders in children if needed
      setSecurityVersion((v) => v + 1);
    }
  };

  // Pre-load essential reference data exactly when user context is successfully initialized
  useEffect(() => {
    if (user && authService.isAuthenticated()) {
      queryClient.prefetchQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getBranchesAll(),
        staleTime: 1000 * 60 * 60, // 1 hour
      });
      queryClient.prefetchQuery({
        queryKey: ['centers'],
        queryFn: () => centerService.getCentersList('active'),
        staleTime: 1000 * 60 * 60, // 1 hour
      });
    }
  }, [user, queryClient]);

  useEffect(() => {
    const checkAuth = async () => {
      // If on login or public auth pages, we don't need to check auth to render
      if (
        pathname === "/login" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password"
      ) {
        setIsLoading(false);
        return;
      }

      const isAuthenticated = authService.isAuthenticated();

      if (!isAuthenticated) {
        router.push("/login");
        setIsLoading(false);
        return;
      }

      // Sync profile data
      try {
        // Try to get from local storage first for instant render
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const storedRolesStr = localStorage.getItem("roles");
          let userRole = currentUser.role;

          if (storedRolesStr) {
            try {
              const roles = JSON.parse(storedRolesStr);
              if (Array.isArray(roles) && roles.length > 0) {
                userRole = roles[0].name;
              }
            } catch (e) {
              console.error("Failed to parse roles", e);
            }
          }

          setUser({
            name: currentUser.full_name || currentUser.name,
            role: currentUser.role_name || userRole || "Staff",
            roleSlug: userRole,
            branch: currentUser.branch?.name || "Head Office",
            avatar_url: currentUser.avatar_url,
            staff_id: currentUser.staff_id,
            user_name: currentUser.user_name,
          });
        }

        // Always try to refresh in background
        await authService.refreshProfile();
        const refreshedUser = authService.getCurrentUser();
        if (refreshedUser) {
          const storedRolesStr = localStorage.getItem("roles");
          let userRole = refreshedUser.role;

          if (storedRolesStr) {
            try {
              const roles = JSON.parse(storedRolesStr);
              if (Array.isArray(roles) && roles.length > 0) {
                userRole = roles[0].name;
              }
            } catch (e) { }
          }

          setUser({
            name: refreshedUser.full_name || refreshedUser.name,
            role: refreshedUser.role_name || userRole || "Staff",
            roleSlug: userRole,
            branch: refreshedUser.branch?.name || "Head Office",
            avatar_url: refreshedUser.avatar_url,
            staff_id: refreshedUser.staff_id,
            user_name: refreshedUser.user_name,
          });
        } else if (!currentUser) {
          // Both failed
          authService.logout();
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed", error);
        // Only redirect if we don't even have local data
        if (!authService.getCurrentUser()) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  useEffect(() => {
    const handleSecurityUpdate = () => {
      console.log("[Security] Dynamic permissions sync triggered");
      refreshUser();
    };

    window.addEventListener("security:updated", handleSecurityUpdate);

    const heartbeat = setInterval(async () => {
      if (authService.isAuthenticated()) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                Accept: "application/json",
              },
            }
          );

          if (response.status === 401) {
            console.warn("Session invalidated. Logging out...");
            authService.logout();
            router.push("/login");
          }
        } catch (e) {
          // ignore network errors
        }
      }
    }, 60000);

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 && !pathname.includes("/login")) {
        const token = localStorage.getItem("token");
        if (token) {
          console.warn("Intercepted 401 error. Logging out...");
          authService.logout();
          window.location.href = "/login";
        }
      }
      return response;
    };

    return () => {
      clearInterval(heartbeat);
      window.fetch = originalFetch;
      window.removeEventListener("security:updated", handleSecurityUpdate);
    };
  }, [pathname, router]);

  // If we are on the login, forgot-password page (or any other public page), render children directly without the shell
  const isPublicPage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  if (isPublicPage) {
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          theme={isDarkMode ? "dark" : "light"}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          className="z-[10000]"
        />
        {children}
      </>
    );
  }

  // prevent showing page content before user is loaded
  if (!user) {
    return <div className="min-h-screen bg-app-background"></div>;
  }

  // Route permission mapping (source of truth for route protection)
  const routePermissions: Record<
    string,
    { permission?: string; permissions?: string[]; roles?: string[] }
  > = {
    "/": { permission: "dashboard.view" },
    "/dashboard": { permission: "dashboard.view" },
    "/admin-dashboard": { permission: "admin_dashboard.view" },
    "/branches": { permission: "branches.view" },
    "/centers": { permission: "centers.view" },
    "/meeting-scheduling": { permission: "sessions.view" },
    "/center-requests": { permission: "customers.approve_transfer" },
    "/groups": { permission: "groups.view" },
    "/customers": { permission: "customers.view" },
    "/customers/requests": { permission: "customers.approve" },
    "/shareholders": { permission: "shareholders.view" },
    "/loan-product": { permission: "loan_products.view" },
    "/investment-product": { permission: "investment_products.view" },
    "/loans/create": { permission: "loans.create" },
    "/loans/approval": { permission: "loans.approve" },
    "/loans/sent-back": { permission: "loans.view" },
    "/loans/activation": { permission: "loans.activate" },
    "/loans/disbursement-queue": { permission: "loans.disbursement_request" },
    "/loans/cancellation": { permission: "loans.request_cancellation" },
    "/loans/cancellation-approval": { permission: "loans.approve_cancellation" },
    "/loans/card": { permission: "loans.view" },
    "/loans/dino": { permission: "loans.view" },
    "/loans": { permission: "loans.view" },
    "/collections/due-list": { permission: "collections.due_list" },
    "/collections": { permission: "collections.view" },
    "/collections/summary": { permission: "collections.summary" },
    "/collections/rejections": { permission: "receipts.approvecancel" },
    "/transaction-approval/salary": { permission: "finance.approve_salary" },
    "/transaction-approval/bank-branch": { permission: "finance.branch_truncation_view" },

    "/finance": { permission: "finance.view" },
    "/fund-transactions": {
      permissions: [
        "finance.shareholders",
        "finance.investments",
        "finance.approveloanpayout",
        "finance.disburse_salary",
        "finance.staffloans",
        "finance.investmentpayouts"
      ]
    },
    "/branch-transactions": { permission: "finance.branch_truncation_view" },
    "/fund-truncation-summary": { permission: "finance.truncation_summary" },
    "/promotion-approval": {
      permission: "promotions.approve",
    },
    "/salary-increment-approval": {
      permission: "salary_increments.approve",
    },
    "/temporary-promotion": {
      permissions: [
        "temporary_promotions.view",
        "temporary_promotions.assign",
        "temporary_promotions.cancel",
      ],
    },
    "/staff-promotion": {
      permissions: [
        "promotions.view",
        "promotions.create",
        "salary_increments.view",
        "salary_increments.create",
      ],
    },
    "/staff-loans/create": { permission: "staffloans.create" },
    "/staff-loans": { permission: "staffloans.view_all" },
    "/staff-loans/approval": { permission: "staffloans.approve" },
    "/staff-management": { permission: "staff.directory" },
    "/roles-privileges": { permission: "roles.view" },
    "/investments": { permission: "investments.view" },
    "/investments/create": { permission: "investments.create" },
    "/investments/approvals": { permission: "investments.approve" },
    "/investments/activation": { permission: "investments.activate" },
    "/investments/reprint-requests": { permission: "investments.authorize_reprint" },
    "/finance/investment-payments": { permission: "finance.issue_receipt" },
    "/documents": { permission: "documents.view" },
    "/reports": { permission: "reports.view" },
    "/public-website": { permission: "website.view" },
    "/agreements/loan": { permission: "loan_agreements.view" },
    "/agreements/investment": { permission: "loan_agreements.view" },
    "/agreements/repayment": { permission: "loan_agreements.view" },
    "/agreements/reprint-requests": {
      permission: "loan_agreements.approve_reprint",
    },
    "/maintenance/ip-whitelisting": { roles: ["super_admin"] },
    "/maintenance/security-settings": { roles: ["super_admin"] },
    "/maintenance/device-management": { roles: ["super_admin"] },
    "/maintenance/backup-system": { roles: ["super_admin"] },
    "/maintenance/system-test": { roles: ["super_admin"] },
    "/maintenance/maintenance-mode": { roles: ["super_admin"] },
    "/maintenance/audit-logs": { roles: ["super_admin"] },
    "/maintenance/login-logs": { roles: ["super_admin"] },
    "/maintenance/modification-logs": { roles: ["super_admin"] },
    "/system-config/document-print-log": { roles: ["super_admin"] },
  };




  // Determine current page ID from pathname
  const getCurrentPage = (): Page => {
    const pathToPageMap: Record<string, Page> = {
      "/": "dashboard",
      "/dashboard": "dashboard",
      "/admin-dashboard": "admin-dashboard",
      "/branches": "branches",
      "/centers": "centers",
      "/meeting-scheduling": "meeting-scheduling",
      "/groups": "groups",
      "/customers": "customers",
      "/loans/create": "loan-create",
      "/loans/approval": "loan-approval",
      "/loans/sent-back": "loan-sent-back",
      "/loans": "loan-list",
      "/loans/card": "loan-card",
      "/loans/dino": "loan-dino",
      "/loans/activation": "loan-activation",
      "/loans/cancellation": "loan-cancellation",
      "/loans/cancellation-approval": "loan-cancellation-approval",
      "/loans/disbursement-queue": "disbursement-queue",
      "/loan-product": "loan-product",
      "/roles-privileges": "roles-privileges",
      "/customers/requests": "customer-requests",
      "/collections/rejections": "receipt-rejections",
      "/collections/due-list": "due-list",
      "/collections": "collections",
      "/collections/summary": "collection-summary",
      "/reports": "reports",
      "/finance": "finance-overview",
      "/fund-transactions": "fund-transactions",
      "/branch-transactions": "branch-transactions",
      "/fund-truncation-summary": "fund-truncation-summary",
      "/investment-product": "investment-product",
      "/investments": "investment-list",
      "/investments/create": "investment-create",
      "/investments/approvals": "investment-approvals",
      "/investments/activation": "investment-activation",
      "/investments/reprint-requests": "investment-reprint-requests",
      "/finance/investment-payments": "investment-payments",
      "/staff-management": "staff-management",
      "/shareholders": "shareholders",
      "/complaints": "complaints",
      "/system-config": "system-config",
      "/documents": "documents",
      "/public-website": "public-website",
      "/center-requests": "center-requests",
      "/transaction-approval/salary": "salary-approval",
      "/transaction-approval/bank-branch": "bank-branch-approval",

      "/staff-promotion": "staff-promotion",
      "/promotion-approval": "promotion-approval",
      "/temporary-promotion": "temporary-promotion",
      "/profile": "profile",
      "/staff-directory": "staff-directory",
      "/staff-loans/create": "staff-loan-create",
      "/staff-loans/approval": "staff-loan-approval",
      "/staff-loans": "staff-loan-list",
      "/agreements/loan": "loan-agreement",
      "/agreements/investment": "investment-agreement",
      "/agreements/repayment": "repayment",
      "/agreements/reprint-requests": "reprint-approvals",
      "/maintenance/ip-whitelisting": "ip-whitelisting",
      "/maintenance/security-settings": "security-settings",
      "/maintenance/device-management": "device-management",
      "/maintenance/backup-system": "backup-system",
      "/maintenance/system-test": "system-test",
      "/maintenance/maintenance-mode": "maintenance-mode",
      "/maintenance/audit-logs": "audit-logs",
      "/maintenance/login-logs": "login-logs",
      "/maintenance/modification-logs": "modification-logs",
      "/cashier/branch-activity": "cashier-branch-activity",
      "/cashier/temp-cashier": "cashier-temp-cashier",
      "/cashier/receipts": "cashier-receipts",
      "/cashier/branch-activity-request": "cashier-branch-activity-request",
      "/cashier/other-branch-collection": "cashier-other-branch-collection",
      "/cashier/staff-request": "cashier-staff-request",
      "/system-config/document-print-log": "system-config-print-log",
      "/system-config/bank-branch": "system-config-bank",
      "/system-config/staff-expense-categories": "system-config-staff-expense-categories",
      "/system-config/gs-divisions": "system-config-gs-divisions",

    };




    if (pathToPageMap[pathname]) {
      return pathToPageMap[pathname];
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1] as Page;
    }

    return "dashboard";
  };

  const handleNavigate = (pageId: Page) => {
    const routeMap: Record<string, string> = {
      dashboard: "/",
      "admin-dashboard": "/admin-dashboard",
      branches: "/branches",
      centers: "/centers",
      "meeting-scheduling": "/meeting-scheduling",
      groups: "/groups",
      customers: "/customers",
      "loan-create": "/loans/create",
      "loan-approval": "/loans/approval",
      "loan-sent-back": "/loans/sent-back",
      "loan-list": "/loans",
      "loan-card": "/loans/card",
      "loan-cancellation": "/loans/cancellation",
      "loan-cancellation-approval": "/loans/cancellation-approval",
      "loan-activation": "/loans/activation",
      "loan-dino": "/loans/dino",
      "disbursement-queue": "/loans/disbursement-queue",
      "loan-product": "/loan-product",
      "roles-privileges": "/roles-privileges",
      "customer-requests": "/customers/requests",
      "receipt-rejections": "/collections/rejections",
      "due-list": "/collections/due-list",
      collections: "/collections",
      "collection-summary": "/collections/summary",
      "salary-approval": "/transaction-approval/salary",
      "bank-branch-approval": "/transaction-approval/bank-branch",

      "staff-promotion": "/staff-promotion",
      "promotion-approval": "/promotion-approval",
      "temporary-promotion": "/temporary-promotion",
      "investment-create": "/investments/create",
      "investment-approvals": "/investments/approvals",
      "investment-activation": "/investments/activation",
      "investment-reprint-requests": "/investments/reprint-requests",
      "investment-product": "/investment-product",
      "investment-list": "/investments",
      "investment-payments": "/finance/investment-payments",
      "finance-overview": "/finance",
      "fund-truncation-summary": "/fund-truncation-summary",
      "staff-directory": "/staff-directory",
      "staff-loan-create": "/staff-loans/create",
      "staff-loan-approval": "/staff-loans/approval",
      "staff-loan-list": "/staff-loans",
      "loan-agreement": "/agreements/loan",
      "investment-agreement": "/agreements/investment",
      repayment: "/agreements/repayment",
      "reprint-approvals": "/agreements/reprint-requests",
      "ip-whitelisting": "/maintenance/ip-whitelisting",
      "security-settings": "/maintenance/security-settings",
      "device-management": "/maintenance/device-management",
      "backup-system": "/maintenance/backup-system",
      "system-test": "/maintenance/system-test",
      "maintenance-mode": "/maintenance/maintenance-mode",
      "audit-logs": "/maintenance/audit-logs",
      "login-logs": "/maintenance/login-logs",
      "modification-logs": "/maintenance/modification-logs",
      "cashier-branch-activity": "/cashier/branch-activity",
      "cashier-temp-cashier": "/cashier/temp-cashier",
      "cashier-receipts": "/cashier/receipts",
      "system-config-greeting": "/system-config/greeting",
      "system-config-leave": "/system-config/leave-process",
      "system-config-bank": "/system-config/bank-branch",
      "system-config-cash": "/system-config/branch-cash-store",
      "system-config-print-log": "/system-config/document-print-log",
      "system-config-staff-expense-categories": "/system-config/staff-expense-categories",
      "system-config-gs-divisions": "/system-config/gs-divisions",
      "cashier-branch-activity-request": "/cashier/branch-activity-request",
      "cashier-other-branch-collection": "/cashier/other-branch-collection",
      "cashier-staff-request": "/cashier/staff-request",
    };

    const path = routeMap[pageId as string] || `/${pageId}`;
    router.push(path);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logout successful", {
        onClose: () => router.push("/login"),
      });
    } catch (error) {
      console.error("Logout failed", error);
      router.push("/login");
    }
  };

  const handleProfileSettings = () => {
    router.push("/profile");
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme={isDarkMode ? "dark" : "light"}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="z-[10000]"
      />
      <div className="flex h-screen overflow-hidden bg-background">
        <MaintenanceGuard />
        <Sidebar
          currentPage={getCurrentPage()}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          userRole={user.roleSlug || user.role}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            user={user}
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onProfileSettings={handleProfileSettings}
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-app-background custom-scrollbar">
            <PermissionGuard
              {...(() => {
                if (pathname === "/staff-management") {
                  const hasAnyStaffAccess =
                    authService.hasPermission("staff.view") ||
                    authService.hasPermission("attendance.view") ||
                    authService.hasPermission("salary.view") ||
                    authService.hasPermission("payroll.view") ||
                    authService.hasPermission("complaints.view") ||
                    authService.hasPermission("leave.view");

                  return hasAnyStaffAccess
                    ? {}
                    : { permission: "staff.view" };
                }

                if (routePermissions[pathname]) {
                  return {
                    permission: routePermissions[pathname].permission,
                    permissions: routePermissions[pathname].permissions,
                    roles: routePermissions[pathname].roles,
                  };
                }

                const match = Object.entries(routePermissions)
                  .filter(
                    ([route]) => route !== "/" && pathname.startsWith(route),
                  )
                  .sort((a, b) => b[0].length - a[0].length)[0];

                if (match) {
                  return {
                    permission: match[1].permission,
                    permissions: match[1].permissions,
                    roles: match[1].roles,
                  };
                }

                return {};
              })()}
            >
              {children}
            </PermissionGuard>
          </main>
        </div>
      </div>
    </>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <BranchProvider>
          <LoadingOverlay />
          <NavigationLoader />
          <MainLayoutContent>{children}</MainLayoutContent>
        </BranchProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}