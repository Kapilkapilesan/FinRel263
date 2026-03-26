import React from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  UsersRound,
  User,
  FileText,
  DollarSign,
  ClipboardList,
  BarChart3,
  Wallet,
  TrendingUp,
  Settings,
  ChevronDown,
  Globe,
  Shield,
  AlertCircle,
  ArrowLeftRight,
  Receipt,
  ChevronLeft,
  Download,
  Calendar,
  PieChart,
  ShieldCheck,
  RotateCcw,
  UserPlus,
  LogIn,
  Activity,
  Banknote,
  History,
  Zap,
  Clock,
  Package,
  MessageSquare,
  Smartphone,
  MapPin,
} from "lucide-react";
import { Page } from "./MainLayout";
import { notificationService } from "../../services/notification.service";
import { authService } from "../../services/auth.service";
import { colors } from "@/themes/colors";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  userRole: string;
}

interface MenuItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
  roles?: string[];
  permission?: string;
  permissions?: string[];
}

export function Sidebar({
  currentPage,
  onNavigate,
  isOpen,
  userRole,
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      permission: "dashboard.view",
    },
    {
      id: "admin-dashboard",
      label: "Admin Dashboard",
      icon: <BarChart3 className="w-5 h-5" />,
      permission: "admin_dashboard.view",
    },
    {
      id: "branches",
      label: "Branches",
      icon: <Building2 className="w-5 h-5" />,
      permission: "branches.view",
    },
    {
      id: "centers-section" as Page,
      label: "Centers (CSU)",
      icon: <Users className="w-5 h-5" />,
      submenu: [
        {
          id: "centers",
          label: "Schedule",
          icon: <ClipboardList className="w-4 h-4" />,
        },
        {
          id: "meeting-scheduling",
          label: "Meeting Schedule",
          icon: <ClipboardList className="w-4 h-4" />,
          permission: "sessions.view",
        },
        {
          id: "center-requests",
          label: "Transfer Requests",
          icon: <ArrowLeftRight className="w-4 h-4" />,
          permission: "customers.approve_transfer",
        },
      ],
      permission: "centers.view",
    },
    {
      id: "groups",
      label: "Groups",
      icon: <UsersRound className="w-5 h-5" />,
      permission: "groups.view",
    },
    {
      id: "customers-section" as Page,
      label: "Customers",
      icon: <User className="w-5 h-5" />,
      submenu: [
        {
          id: "customers",
          label: "Customer List",
          icon: <ClipboardList className="w-4 h-4" />,
        },
        {
          id: "customer-requests" as Page,
          label: "Edit Approvals",
          icon: <ShieldCheck className="w-4 h-4" />,
          permission: "customers.approve",
        },
      ],
      permission: "customers.view",
    },
    {
      id: "shareholders",
      label: "Shareholders",
      icon: <PieChart className="w-5 h-5" />,
      permission: "shareholders.view",
    },
  ];

  const productMenuItems: MenuItem[] = [
    {
      id: "loan-product" as Page,
      label: "Loan",
      icon: <DollarSign className="w-4 h-4" />,
      permission: "loan_products.view",
    },
    {
      id: "investment-product" as Page,
      label: "Investment",
      icon: <TrendingUp className="w-4 h-4" />,
      permission: "investment_products.view",
    },
  ];

  const loanMenuItems: MenuItem[] = [
    {
      id: "loan-create" as Page,
      label: "Create Loan",
      icon: <FileText className="w-4 h-4" />,
      permission: "loans.create",
    },
    {
      id: "loan-approval" as Page,
      label: "Loan Approval",
      icon: <Shield className="w-4 h-4" />,
      permission: "loans.approve",
    },
    {
      id: "loan-activation" as Page,
      label: "Loan Activation",
      icon: <Zap className="w-4 h-4" />,
      permission: "loans.activate",
    },
    {
      id: "disbursement-queue" as Page,
      label: "Dispayment",
      icon: <Clock className="w-4 h-4" />,
      permission: "loans.disbursement_request",
    },
    {
      id: "loan-sent-back" as Page,
      label: "Sent Back Loans",
      icon: <AlertCircle className="w-4 h-4" />,
      permission: "loans.view",
    },
    {
      id: "loan-cancellation" as Page,
      label: "Loan Cancellation",
      icon: <RotateCcw className="w-4 h-4" />,
      permission: "loans.request_cancellation",
    },
    {
      id: "loan-cancellation-approval" as Page,
      label: "Cancellation Approval",
      icon: <ShieldCheck className="w-4 h-4" />,
      permission: "loans.approve_cancellation",
    },
    {
      id: "loan-card" as Page,
      label: "Loan Card",
      icon: <Receipt className="w-4 h-4" />,
      permission: "loans.view",
    },
    {
      id: "loan-list" as Page,
      label: "Loan List",
      icon: <ClipboardList className="w-4 h-4" />,
      permission: "loans.view",
    },
    {
      id: "loan-dino" as Page,
      label: "Dino",
      icon: <DollarSign className="w-4 h-4" />,
      permission: "loans.view",
    },
  ];

  const collectionMenuItems: MenuItem[] = [
    {
      id: "due-list" as Page,
      label: "Due List",
      icon: <ClipboardList className="w-4 h-4" />,
      permission: "collections.due_list",
    },
    {
      id: "collections" as Page,
      label: "Collections",
      icon: <DollarSign className="w-4 h-4" />,
      permission: "collections.view",
    },
    {
      id: "receipt-rejections" as Page,
      label: "Collection Cancel Requests",
      icon: <RotateCcw className="w-4 h-4" />,
      permission: "receipts.approvecancel",
    },
    {
      id: "collection-summary" as Page,
      label: "Collection Summary",
      icon: <Receipt className="w-4 h-4" />,
      permission: "collections.summary",
    },
  ];

  const approvalMenuItems: MenuItem[] = [
    {
      id: "salary-approval" as Page,
      label: "Salary Approval",
      icon: <ShieldCheck className="w-4 h-4" />,
      permission: "finance.approve_salary",
    },
    {
      id: "cashier-branch-activity-request" as Page,
      label: "Branch Approvals",
      icon: <ClipboardList className="w-4 h-4" />,
      permission: "finance.branch_truncation_view",
    },
    {
      id: "bank-branch-approval" as Page,
      label: "Bank & Branch Approvals",
      icon: <RotateCcw className="w-4 h-4" />,
      permission: "finance.branch_truncation_view",
    },
  ];

  const financeMenuItems: MenuItem[] = [
    {
      id: "finance-overview" as Page,
      label: "Finance Overview",
      icon: <Wallet className="w-4 h-4" />,
      permission: "finance.view",
    },
    {
      id: "investment-payments" as Page,
      label: "Investment Payments",
      icon: <DollarSign className="w-4 h-4" />,
      permission: "finance.issue_receipt",
    },
    {
      id: "fund-transactions" as Page,
      label: "Fund Truncation",
      icon: <ArrowLeftRight className="w-4 h-4" />,
      permissions: [
        "finance.shareholders",
        "finance.investments",
        "finance.approveloanpayout",
        "finance.disburse_salary",
        "finance.staffloans",
        "finance.investmentpayouts"
      ],
    },
    {
      id: "fund-truncation-summary" as Page,
      label: "Truncation Summary",
      icon: <FileText className="w-4 h-4" />,
      permission: "finance.truncation_summary",
    },
  ];

  const promotionMenuItems: MenuItem[] = [
    {
      id: "staff-promotion" as Page,
      label: "Staff Promotion",
      icon: <UserPlus className="w-4 h-4" />,
      permissions: ["promotions.view", "salary_increments.view", "salary_increments.create"],
    },
    {
      id: "promotion-approval" as Page,
      label: "Promotion Approval",
      icon: <ShieldCheck className="w-4 h-4" />,
      permission: "promotions.approve",
    },
    {
      id: "salary-increment-approval" as Page,
      label: "Salary Increment Approval",
      icon: <DollarSign className="w-4 h-4" />,
      permission: "salary_increments.approve",
    },
    {
      id: "temporary-promotion" as Page,
      label: "Temporary Promotion",
      icon: <Clock className="w-4 h-4" />,
      permission: "temporary_promotions.manage",
    },
  ];

  const staffLoanMenuItems: MenuItem[] = [
    {
      id: "staff-loan-create" as Page,
      label: "Create Staff Loan",
      icon: <FileText className="w-4 h-4" />,
      permission: "staffloans.create",
    },
    {
      id: "staff-loan-list" as Page,
      label: "Staff Loans",
      icon: <FileText className="w-4 h-4" />,
      permission: "staffloans.view_all",
    },
    {
      id: "staff-loan-approval" as Page,
      label: "Staff Loan Approvals",
      icon: <ShieldCheck className="w-4 h-4" />,
      permission: "staffloans.approve",
    },
  ];

  const agreementMenuItems: MenuItem[] = [
    {
      id: "loan-agreement" as Page,
      label: "Loan Agreement",
      icon: <FileText className="w-4 h-4" />,
      permission: "loan_agreements.view",
    },
    {
      id: "investment-agreement" as Page,
      label: "Investment Agreement",
      icon: <TrendingUp className="w-4 h-4" />,
      permission: "loan_agreements.view",
    },
    {
      id: "repayment" as Page,
      label: "Repayment",
      icon: <RotateCcw className="w-4 h-4" />,
      permission: "loan_agreements.view",
    },
    {
      id: "reprint-approvals" as Page,
      label: "Reprint Requests",
      icon: <Clock className="w-4 h-4" />,
      permission: "loan_agreements.approve_reprint",
    },
  ];

  const cashierMenuItems: MenuItem[] = [
    {
      id: "cashier-branch-activity" as Page,
      label: "Branch Activity",
      icon: <Activity className="w-4 h-4" />,
      permission: "finance.branch_truncation_view",
    },
    {
      id: "cashier-branch-activity-request" as Page,
      label: "Branch Request",
      icon: <ClipboardList className="w-4 h-4" />,
      permission: "finance.branch_truncation_view",
    },
    {
      id: "cashier-staff-request" as Page,
      label: "Staff Request",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "cashier-temp-cashier" as Page,
      label: "Temp Cashier",
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      id: "cashier-receipts" as Page,
      label: "Receipt Creation & Cancellation",
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: "cashier-other-branch-collection" as Page,
      label: userRole === 'field_officer' ? "Collection History" : "Branch Collection",
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
  ];

  const fetchCountsImmediate = async () => {
    try {
      const response = await notificationService.getSidebarCounts();
      if (response.status === "success") {
        setCounts(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch sidebar counts:", error);
    }
  };

  React.useEffect(() => {
    setIsMounted(true);
    fetchCountsImmediate();
    setCurrentUser(authService.getCurrentUser());

    // Initial fetch immediately, then set up polling
    intervalRef.current = setInterval(fetchCountsImmediate, 30000);

    // Also set up a visibility change listener to pause/resume polling when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        fetchCountsImmediate();
        intervalRef.current = setInterval(fetchCountsImmediate, 30000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  React.useEffect(() => {
    if (!currentPage || !isMounted) return;

    // Trigger immediate count update when navigating to specific pages
    const shouldUpdateImmediately = [
      'customers',
      'customer-requests',
      'loan-approval',
      'salary-approval',
      'fund-transactions',
      'complaints',
      'receipt-rejections',
      'staff-loan-approval',
      'promotion-approval',
      'salary-increment-approval',
      'temporary-promotion'
    ];

    if (shouldUpdateImmediately.includes(currentPage as string)) {
      fetchCountsImmediate();
    }

    const findParentMenu = (page: Page): string | null => {
      if (loanMenuItems.some((m) => m.id === page || page === "loan-card")) return "loans";
      if (productMenuItems.some((m) => m.id === page)) return "products";
      if (financeMenuItems.some((m) => m.id === page)) return "finance";
      if (collectionMenuItems.some((m) => m.id === page))
        return "collections-section";
      if (approvalMenuItems.some((m) => m.id === page))
        return "approvals-section";
      if (promotionMenuItems.some((m) => m.id === page))
        return "promotion-section";
      if (staffLoanMenuItems.some((m) => m.id === page))
        return "staff-loan-section";
      if (agreementMenuItems.some((m) => m.id === page))
        return "agreement-section";
      if (cashierMenuItems.some((m) => m.id === page))
        return "cashier-section";

      if (["investment-create", "investment-list", "investment-approvals", "investment-activation"].includes(page as string)) {
        return "investments-section";
      }

      if (["system-config-greeting", "system-config-leave", "system-config-bank", "system-config-cash", "system-config-print-log", "system-config-gs-divisions"].includes(page as string)) {
        return "system-config-section";
      }

      for (const item of menuItems) {
        if (item.submenu?.some((sub) => sub.id === page)) {
          return item.id as string;
        }
      }
      return null;
    };

    const parentId = findParentMenu(currentPage);
    if (parentId && !expandedMenus.includes(parentId)) {
      setExpandedMenus((prev) => [...prev, parentId]);
    }
  }, [currentPage, isMounted]);

  React.useEffect(() => {
    if (isMounted && !isCollapsed) {
      const timer = setTimeout(() => {
        const activeItem = document.getElementById("active-sidebar-item");
        const navContainer = activeItem?.closest("nav");
        if (activeItem && navContainer) {
          const rect = activeItem.getBoundingClientRect();
          const containerRect = navContainer.getBoundingClientRect();
          const isVisible =
            rect.top >= containerRect.top &&
            rect.bottom <= containerRect.bottom;
          if (!isVisible) {
            activeItem.scrollIntoView({ behavior: "auto", block: "nearest" });
          }
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentPage, isMounted, isCollapsed]);

  const toggleMenu = (menuId: string) => {
    if (!isCollapsed) {
      setExpandedMenus((prev) =>
        prev.includes(menuId)
          ? prev.filter((id) => id !== menuId)
          : [...prev, menuId]
      );
    }
  };

  const getBadgeCount = (id: string): number => {
    switch (id) {
      case "centers":
        return counts.centers || 0;
      case "center-requests":
        return counts.center_transfers || 0;
      case "centers-section":
        return (counts.centers || 0) + (counts.center_transfers || 0);
      case "loan-approval":
        return counts.loans || 0;
      case "loan-sent-back":
        return counts.sent_back_loans || 0;
      case "loan-activation":
        return counts.approved_loans || 0;
      case "disbursement-queue":
        return counts.activated_loans || 0;
      case "loans":
        return (counts.loans || 0) + (counts.sent_back_loans || 0) + (counts.approved_loans || 0) + (counts.activated_loans || 0);
      case "salary-approval":
        return counts.salaries || 0;
      case "bank-branch-approval":
        return counts.pending_bank_branch_approvals || 0;
      case "approvals-section":
        return (counts.salaries || 0) + (counts.pending_bank_branch_approvals || 0);
      case "fund-transactions":
        return (counts.salaries || 0) + (counts.disbursements || 0);
      case "finance-overview":
        return 0;
      case "finance":
        return (counts.salaries || 0) + (counts.disbursements || 0);
      case "complaints":
        return counts.complaints || 0;
      case "receipt-rejections":
        return counts.receipt_cancellations || counts.reprint_requests || 0;
      case "customer-requests":
        return counts.customer_edits || 0;
      case "customers-section":
        return counts.customer_edits || 0;
      case "staff-promotion":
        return 0;
      case "promotion-approval":
        return counts.promotions || 0;
      case "salary-increment-approval":
        return counts.salary_increments || 0;
      case "temporary-promotion":
        return 0;
      case "promotion-section":
        return (counts.promotions || 0) + (counts.salary_increments || 0);
      case "staff-management":
        return counts.attendance || 0;
      case "reprint-approvals":
        return counts.reprint_requests || 0;
      case "investment-approvals":
        return counts.pending_investments || 0;
      case "investment-activation":
        return counts.approved_investments || 0;
      case "agreement-section":
        return counts.reprint_requests || 0;
      case "investments-section":
        return (counts.pending_investments || 0) + (counts.approved_investments || 0);
      case "cashier-branch-activity":
        return (counts.pending_iou_approvals || 0) + (counts.pending_iou_payouts || 0);
      case "cashier-branch-activity-request":
        return (counts.pending_branch_expenses || 0) + (counts.receipt_cancellations || 0) + (counts.pending_iou_approvals || 0);
      case "cashier-section":
        return (counts.pending_iou_approvals || 0) + (counts.pending_iou_payouts || 0) + (counts.pending_branch_expenses || 0) + (counts.receipt_cancellations || 0);
      default:
        return 0;
    }
  };

  const renderBadge = (id: string, isSmall = false) => {
    const count = getBadgeCount(id);
    if (count <= 0) return null;

    return (
      <span
        className={`inline-flex items-center justify-center bg-primary-600 text-white rounded-full font-bold shadow-md transform transition-all duration-300 ${isSmall
          ? "min-w-[18px] h-[18px] text-[10px] px-1"
          : "min-w-[22px] h-[22px] text-[11px] px-1.5"
          } ${isCollapsed
            ? "absolute -top-1 -right-1 border-2 border-white dark:border-gray-800"
            : "relative ml-auto"
          } hover:scale-110`}
      >
        {count > 99 ? "99+" : count}
        {!isCollapsed && (
          <span className="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-25"></span>
        )}
      </span>
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.roles && !item.roles.includes(userRole)) return null;
    if (
      item.permission &&
      (!isMounted || !authService.hasPermission(item.permission))
    )
      return null;

    const hasSubmenu = !!item.submenu?.length;
    const isChildActive = item.submenu?.some((sub) => sub.id === currentPage);
    const isExpanded = expandedMenus.includes(item.id as string);
    const isActive = currentPage === item.id;
    const shouldHighlight = isActive || isChildActive;

    if (item.permissions && isMounted) {
      if (!item.permissions.some(p => authService.hasPermission(p))) {
        return null;
      }
    }

    if (hasSubmenu) {
      return (
        <div key={item.id} className="mx-3 mb-1">
          {isCollapsed ? (
            <button
              id={isActive ? "active-sidebar-item" : undefined}
              onClick={() => toggleMenu(item.id as string)}
              className={`w-full flex items-center justify-center aspect-square rounded-2xl transition-all group relative ${shouldHighlight ? "bg-primary-50 dark:bg-primary-100/10 border border-primary-100 dark:border-primary-500/30 shadow-[0_8px_20px_rgba(59,130,246,0.12)]" : "text-text-secondary hover:bg-hover border border-transparent"
                }`}
              title={item.label}
            >
              <div
                className={`${shouldHighlight ? "text-primary-600" : "text-text-muted group-hover:text-text-primary"
                  }`}
              >
                {item.icon}
              </div>
              {renderBadge(item.id as string)}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ) : (
            <>
              <button
                id={isActive ? "active-sidebar-item" : undefined}
                onClick={() => toggleMenu(item.id as string)}
                className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-300 group ${shouldHighlight
                  ? "bg-primary-50 dark:bg-primary-100/10 text-primary-600 shadow-[0_8px_20px_rgba(59,130,246,0.12)] border border-primary-100 dark:border-primary-500/30 ring-1 ring-primary-500/5"
                  : "text-text-secondary hover:bg-hover border border-transparent"
                  }`}
              >
                <div className="flex-1 flex items-center justify-between transition-transform duration-300 group-hover:translate-x-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`transition-colors ${shouldHighlight ? "text-primary-600" : "text-text-muted group-hover:text-text-primary"
                        }`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold tracking-tight">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderBadge(item.id as string, true)}
                    <div className="w-5 h-5 flex items-center justify-center bg-muted-bg rounded-full group-hover:bg-card transition-colors">
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    </div>
                  </div>
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
              >
                <div className="ml-4 mt-1 space-y-1 pl-4 py-1 relative">
                  {item.submenu?.map((subItem) => {
                    if (subItem.roles && !subItem.roles.includes(userRole))
                      return null;
                    if (
                      subItem.permission &&
                      (!isMounted ||
                        !authService.hasPermission(subItem.permission))
                    )
                      return null;

                    if (
                      subItem.permissions &&
                      isMounted &&
                      !subItem.permissions.some(p => authService.hasPermission(p))
                    )
                      return null;

                    const isSubActive = currentPage === subItem.id;

                    return (
                      <div key={subItem.id} className="relative group/sub z-10">
                        {/* Simplified active indicator handled by button styles */}
                        <button
                          id={isSubActive ? "active-sidebar-item" : undefined}
                          onClick={() => onNavigate(subItem.id)}
                          className={`w-full flex items-center justify-between px-5 py-2.5 rounded-2xl transition-all text-sm font-bold group ${isSubActive
                            ? "bg-primary-50 dark:bg-primary-100/10 text-primary-600 shadow-sm border border-primary-100 dark:border-primary-500/30"
                            : "text-text-secondary hover:bg-hover hover:translate-x-1 border border-transparent"
                            }`}
                        >
                          <div className="flex-1 flex items-center justify-between transition-transform duration-300 group-hover:translate-x-1">
                            <div className="flex items-center gap-2">
                              {subItem.icon}
                              <span>{subItem.label}</span>
                            </div>
                            {renderBadge(subItem.id as string, true)}
                          </div>
                          {isSubActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse ml-2" />
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {(() => {
                    const visibleSubmenu = item.submenu?.filter(subItem => {
                      if (subItem.roles && !subItem.roles.includes(userRole)) return false;
                      if (subItem.permission && (!isMounted || !authService.hasPermission(subItem.permission))) return false;
                      if (subItem.permissions && isMounted && !subItem.permissions.some(p => authService.hasPermission(p))) return false;
                      return true;
                    }) || [];

                    const activeIndex = visibleSubmenu.findIndex(s => s.id === currentPage);
                    if (activeIndex !== -1) {
                      return (
                        <div
                          className="absolute border-l-[2px] border-b-[2px] border-[#0284c7] dark:border-[#38bdf8] rounded-bl-[16px] pointer-events-none z-20 transition-all duration-500 ease-in-out"
                          style={{
                            left: '0px',
                            top: '-5px',
                            width: '16px',
                            height: `calc(${activeIndex * 44 + 27}px)`
                          }}
                        >
                          <svg
                            className="absolute -right-[6px] -bottom-[7.5px] text-[#0284c7] dark:text-[#38bdf8]"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    // Leaf menu item
    return (
      <div key={item.id} className="mx-3 mb-1">
        <button
          id={isActive ? "active-sidebar-item" : undefined}
          onClick={() => onNavigate(item.id)}
          className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 group relative ${isActive
            ? "bg-primary-50 dark:bg-primary-100/10 text-primary-600 shadow-sm border border-primary-100 dark:border-primary-500/30"
            : "text-text-secondary hover:bg-hover border border-transparent"
            }`}
          title={isCollapsed ? item.label : ""}
        >
          <div className={`flex-1 flex items-center gap-3 transition-transform duration-300 ${!isCollapsed ? 'group-hover:translate-x-1' : ''}`}>
            <div
              className={`${isActive
                ? "text-primary-600"
                : "text-text-muted group-hover:text-text-primary"
                } transition-colors`}
            >
              {item.icon}
            </div>

            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between overflow-hidden">
                <span className="text-sm font-bold tracking-tight truncate">
                  {item.label}
                </span>
                {renderBadge(item.id as string, true)}
              </div>
            )}
          </div>

          {isCollapsed && (
            <>
              {renderBadge(item.id as string)}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            </>
          )}
        </button>
      </div>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => {
    if (isCollapsed) return <div className="h-4" />;
    return (
      <div className="px-6 mt-6 mb-2">
        <p className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase opacity-60">
          {title}
        </p>
      </div>
    );
  };

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isCollapsed ? "w-24" : "w-[280px]"}
        bg-sidebar flex flex-col border-r border-border-default
        transform transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      <div
        className={`p-6 ${isCollapsed ? "px-4" : "px-6"} flex items-center ${isCollapsed ? "justify-center" : "justify-between"
          }`}
      >
        <div className="flex items-center gap-3">

          {!isCollapsed && (
            <div className="overflow-hidden flex flex-col justify-center">
              <img
                src="/bms_logo.png"
                alt="BMS Capital Solutions"
                className="h-12 md:h-16 w-auto max-w-full object-contain"
              />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar pb-24">
        {/* Polling Status Indicator */}
        {/* {isMounted && (
          <div className="px-6 py-2 border-b border-gray-200 dark:border-gray-700">

          </div>
        )} */}
        {isMounted &&
          (authService.hasPermission("dashboard.view") ||
            authService.hasPermission("admin_dashboard.view") ||
            authService.hasPermission("branches.view") ||
            authService.hasPermission("centers.view") ||
            authService.hasPermission("groups.view") ||
            authService.hasPermission("customers.view") ||
            authService.hasPermission("shareholders.view")) && (
            <SectionHeader title="Overview" />
          )}

        {menuItems.map(renderMenuItem)}

        {isMounted &&
          (authService.hasPermission("loan_products.view") ||
            authService.hasPermission("investment_products.view")) && (
            <>
              <SectionHeader title="Product" />
              {renderMenuItem({
                id: "products" as Page,
                label: "Product",
                icon: <Package className="w-5 h-5" />,
                submenu: productMenuItems,
              })}
            </>
          )}

        {isMounted &&
          (authService.hasPermission("loans.create") ||
            authService.hasPermission("loans.approve") ||
            authService.hasPermission("loans.activate") ||
            authService.hasPermission("loans.disbursement_request") ||
            authService.hasPermission("loans.view")) && (
            <>
              <SectionHeader title="Loans" />
              {renderMenuItem({
                id: "loans" as Page,
                label: "Loans",
                icon: <FileText className="w-5 h-5" />,
                submenu: loanMenuItems,
              })}
            </>
          )}

        {isMounted &&
          (authService.hasPermission("collections.view") ||
            authService.hasPermission("collections.due_list") ||
            authService.hasPermission("collections.summary") ||
            authService.hasPermission("receipts.approvecancel")) && (
            <>
              <SectionHeader title="Collections" />
              {renderMenuItem({
                id: "collections-section" as Page,
                label: "Collections",
                icon: <DollarSign className="w-5 h-5" />,
                submenu: collectionMenuItems,
              })}
            </>
          )}

        {isMounted &&
          (authService.hasPermission("investments.view") ||
            authService.hasPermission("investments.create") ||
            authService.hasPermission("investments.approve") ||
            authService.hasPermission("investments.activate") ||
            authService.hasPermission("investments.authorize_reprint")) && (
            <>
              <SectionHeader title="Investments" />
              {renderMenuItem({
                id: "investments-section" as Page,
                label: "Investments",
                icon: <TrendingUp className="w-5 h-5" />,
                permission: "investments.view",
                submenu: [
                  {
                    id: "investment-create" as Page,
                    label: "Create Investment",
                    icon: <FileText className="w-4 h-4" />,
                    permission: "investments.create",
                  },
                  {
                    id: "investment-approvals" as Page,
                    label: "Investment Approval",
                    icon: <ShieldCheck className="w-4 h-4" />,
                    permission: "investments.approve",
                  },
                  {
                    id: "investment-activation" as Page,
                    label: "Investment Activation",
                    icon: <Zap className="w-4 h-4" />,
                    permission: "investments.activate",
                  },
                  {
                    id: "investment-list" as Page,
                    label: "Investment List",
                    icon: <ClipboardList className="w-4 h-4" />,
                    permission: "investments.view",
                  },
                ],
              })}
            </>
          )}

        {isMounted && authService.hasPermission("reports.view") && (
          <>
            <SectionHeader title="Analytics" />
            {renderMenuItem({
              id: "reports" as Page,
              label: "Reports",
              icon: <BarChart3 className="w-5 h-5" />,
              permission: "reports.view",
            })}
          </>
        )}

        {isMounted &&
          (authService.hasPermission("finance.approve_salary") ||
            authService.hasPermission("receipts.approve")) && (
            <>
              <SectionHeader title="Approvals" />
              {renderMenuItem({
                id: "approvals-section" as Page,
                label: "Transaction Approval",
                icon: <ShieldCheck className="w-5 h-5" />,
                submenu: approvalMenuItems,
              })}
            </>
          )}

        {isMounted &&
          (authService.hasPermission("finance.view") ||
            authService.hasPermission("finance.transactions")) && (
            <>
              <SectionHeader title="Finance" />
              {renderMenuItem({
                id: "finance" as Page,
                label: "Finance",
                icon: <Wallet className="w-5 h-5" />,
                submenu: financeMenuItems,
              })}
            </>
          )}

        {isMounted &&
          (authService.hasPermission("promotions.view") ||
            authService.hasPermission("promotions.create") ||
            authService.hasPermission("promotions.approve") ||
            authService.hasPermission("salary_increments.view") ||
            authService.hasPermission("salary_increments.create") ||
            authService.hasPermission("salary_increments.approve") ||
            authService.hasPermission("temporary_promotions.manage") ||
            authService.hasPermission("temporary_promotions.view")) && (
            <>
              <SectionHeader title="Promotion" />
              {renderMenuItem({
                id: "promotion-section" as Page,
                label: "Promotion",
                icon: <TrendingUp className="w-5 h-5" />,
                submenu: promotionMenuItems,
              })}
            </>
          )}

        {isMounted &&
          (authService.hasPermission("staffloans.create") ||
            authService.hasPermission("staffloans.view") ||
            authService.hasPermission("staffloans.approve")) && (
            <>
              <SectionHeader title="Staff Loans" />
              {renderMenuItem({
                id: "staff-loan-section" as Page,
                label: "Staff Loan",
                icon: <DollarSign className="w-5 h-5" />,
                submenu: staffLoanMenuItems,
              })}
            </>
          )}

        {isMounted &&
          (authService.hasPermission("loan_agreements.view") ||
            authService.hasPermission("loan_agreements.approve_reprint")) && (
            <>
              <SectionHeader title="Agreement & Forms" />
              {renderMenuItem({
                id: "agreement-section" as Page,
                label: "Agreements",
                icon: <FileText className="w-5 h-5" />,
                submenu: agreementMenuItems,
              })}
            </>
          )}

        {isMounted && (
          <>
            <SectionHeader title="Cashier" />
            {renderMenuItem({
              id: "cashier-section" as Page,
              label: "Cashier",
              icon: <Banknote className="w-5 h-5" />,
              submenu: cashierMenuItems,
            })}
          </>
        )}

        {isMounted &&
          (authService.hasPermission("staff.view") ||
            authService.hasPermission("roles.view") ||
            authService.hasPermission("permissions.view") ||
            authService.hasPermission("complaints.view")) && (
            <>
              <SectionHeader title="Management" />
              {renderMenuItem({
                id: "staff-directory" as Page,
                label: "Staff Directory",
                icon: <Users className="w-5 h-5" />,
                permission: "staff.directory",
              })}
              {renderMenuItem({
                id: "staff-management" as Page,
                label: "Staff Management",
                icon: <Users className="w-5 h-5" />,
                permissions: ["staff.view", "attendance.view", "salary.view", "payroll.view", "leave.view"],
              })}
              {renderMenuItem({
                id: "roles-privileges" as Page,
                label: "Roles",
                icon: <Shield className="w-5 h-5" />,
                permission: "roles.view",
              })}
              {renderMenuItem({
                id: "complaints" as Page,
                label: "Complaints",
                icon: <MessageSquare className="w-5 h-5" />,
                permission: "complaints.view",
              })}
            </>
          )}



        {isMounted && userRole === 'super_admin' && (
          <>
            <SectionHeader title="System" />
            {renderMenuItem({
              id: 'ip-whitelisting' as Page,
              label: 'IP Whitelisting',
              icon: <Shield className="w-5 h-5" />,
            })}

            {renderMenuItem({
              id: 'device-management' as Page,
              label: 'Device Management',
              icon: <Smartphone className="w-5 h-5" />,
            })}

            <SectionHeader title="Maintenance" />
            {renderMenuItem({
              id: 'maintenance-section' as Page,
              label: 'Maintenance System',
              icon: <Settings className="w-5 h-5" />,
              submenu: [
                { id: 'security-settings' as Page, label: 'Security Settings', icon: <Shield className="w-4 h-4" /> },
                { id: 'backup-system' as Page, label: 'Backup System', icon: <Download className="w-4 h-4" /> },
                { id: 'system-test' as Page, label: 'System Test', icon: <ArrowLeftRight className="w-4 h-4" /> },
                { id: 'maintenance-mode' as Page, label: 'Maintenance Mode', icon: <AlertCircle className="w-4 h-4" /> },
                { id: 'audit-logs' as Page, label: 'Audit Logs', icon: <FileText className="w-4 h-4" /> },
                { id: 'modification-logs' as Page, label: 'Modification Logs', icon: <History className="w-4 h-4" /> },
                { id: 'login-logs' as Page, label: 'Login Logs', icon: <LogIn className="w-4 h-4" /> },
              ],
            })}
          </>
        )}

        {isMounted && userRole === 'super_admin' && (
          <>
            <SectionHeader title="Settings" />
            {renderMenuItem({
              id: "system-config-section" as Page,
              label: "System Config",
              icon: <Settings className="w-5 h-5" />,
              submenu: [
                {
                  id: "system-config-greeting" as Page,
                  label: "Greeting",
                  icon: <MessageSquare className="w-4 h-4" />
                },
                {
                  id: "system-config-leave" as Page,
                  label: "Leave Process",
                  icon: <Calendar className="w-4 h-4" />
                },
                {
                  id: "system-config-bank" as Page,
                  label: "Bank & Branch",
                  icon: <Building2 className="w-4 h-4" />
                },
                {
                  id: "system-config-cash" as Page,
                  label: "Branch cash store",
                  icon: <Wallet className="w-4 h-4" />
                },
                {
                  id: "system-config-print-log" as Page,
                  label: "Document Print log",
                  icon: <FileText className="w-4 h-4" />
                },
                {
                  id: "system-config-staff-expense-categories" as Page,
                  label: "Staff Expense Categories",
                  icon: <DollarSign className="w-4 h-4" />
                },
                {
                  id: "system-config-gs-divisions" as Page,
                  label: "GS Division",
                  icon: <MapPin className="w-4 h-4" />
                }
              ]
            })}
          </>
        )}

        {isMounted && authService.hasPermission("documents.view") && (
          renderMenuItem({
            id: "documents" as Page,
            label: "Documents",
            icon: <Download className="w-5 h-5" />,
            permission: "documents.view",
          })
        )}

        {isMounted && authService.hasPermission("website.view") && (
          renderMenuItem({
            id: "public-website" as Page,
            label: "Public Website",
            icon: <Globe className="w-5 h-5" />,
            permission: "website.view",
          })
        )}
      </nav>

      <div className="p-4 border-t border-border-default bg-sidebar mt-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group hover:bg-hover ${isCollapsed ? "justify-center" : ""
            }`}
        >
          <div className="p-1.5 rounded-lg text-text-muted group-hover:text-primary-600 transition-colors">
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? "rotate-180" : ""
                }`}
            />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-bold text-text-secondary group-hover:text-primary-600 tracking-tight">
              Collapse
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}