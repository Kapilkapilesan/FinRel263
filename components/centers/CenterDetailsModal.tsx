import {
  X,
  Users,
  MapPin,
  Calendar,
  User,
  Building2,
  Clock,
  Info,
  CheckCircle,
  Edit2,
  AlertCircle,
  Trash2,
  FileText,
  Tag,
} from "lucide-react";
import { Center } from "../../types/center.types";
import { colors } from "../../themes/colors";
import { useState, useEffect, useCallback } from "react";
import { centerService } from "../../services/center.service";

interface CenterDetailsModalProps {
  centerId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isFieldOfficer?: boolean;
}

export function CenterDetailsModal({
  centerId,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isFieldOfficer,
}: CenterDetailsModalProps) {
  const [center, setCenter] = useState<Center | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCenterDetails = useCallback(async () => {
    if (!centerId) {
      setCenter(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const centerData = await centerService.getCenterById(centerId);
      setCenter(centerData);
    } catch (err: any) {
      console.error("Failed to fetch center details:", err);
      setError(err.message || "Failed to load center details");
    } finally {
      setIsLoading(false);
    }
  }, [centerId]);

  useEffect(() => {
    if (isOpen && centerId) {
      fetchCenterDetails();
    } else {
      // Reset state when modal closes
      setCenter(null);
      setError(null);
    }
  }, [isOpen, centerId, fetchCenterDetails]);

  if (!isOpen) return null;

  // Show loading state
  if (isLoading && !center) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-border-default">
          <div className="px-6 py-4 border-b border-border-divider flex items-center justify-between bg-card sticky top-0 z-10 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: colors.primary[50] }}
              >
                <Users
                  className="w-5 h-5"
                  style={{ color: colors.primary[600] }}
                />
              </div>
              <h2 className="text-lg font-bold text-text-primary leading-tight">
                Loading...
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-full transition-colors text-text-muted"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" style={{ borderColor: colors.primary[600] }}></div>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-text-muted">
              Loading center details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !center) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-border-default">
          <div className="px-6 py-4 border-b border-border-divider flex items-center justify-between bg-card sticky top-0 z-10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-text-primary leading-tight">
                Error
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-full transition-colors text-text-muted"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchCenterDetails}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:opacity-90 text-sm font-bold transition-all shadow-lg"
              style={{ backgroundColor: colors.primary[600] }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no center is loaded yet and no error, don't render
  if (!center) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-border-default">
        {/* Clean Header matching CenterForm */}
        <div className="px-6 py-4 border-b border-border-divider flex items-center justify-between bg-card sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${colors.primary[600]}15` }}
            >
              <Users
                className="w-5 h-5"
                style={{ color: colors.primary[600] }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary leading-tight">
                {center.center_name}
              </h2>
              <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">
                {center.CSU_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-full transition-colors text-text-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar transition-colors">
          {/* Highlight Box */}
          <div className="flex items-center justify-between p-4 bg-input rounded-xl border border-border-divider">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-black text-text-muted tracking-widest">
                Status
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${center.status === "active"
                    ? "bg-green-500 animate-pulse"
                    : center.status === "rejected"
                      ? "bg-red-500"
                      : "bg-amber-500"
                    }`}
                />
                <span
                  className={`text-sm font-black uppercase tracking-tight ${center.status === "active"
                    ? "text-green-600 dark:text-green-400"
                    : center.status === "rejected"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                    }`}
                >
                  {center.status === "inactive"
                    ? "Pending Approval"
                    : center.status}
                </span>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[9px] uppercase font-black text-text-muted tracking-widest">
                Groups
              </span>
              <p className="text-sm font-black text-text-primary">
                {center.groups_count ?? center.group_count ?? 0} Registered
              </p>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <InfoItem
              label="Associated Branch"
              value={center.branch?.branch_name || center.branch_id}
              icon={<Building2 size={14} />}
            />
            <InfoItem
              label="Location Context"
              value={center.location || "N/A"}
              icon={<MapPin size={14} />}
            />
            <InfoItem
              label="Assigned User"
              value={center.staff?.full_name ? `${center.staff.full_name} (${center.staff_id})` : (center.staff_id || "Unassigned")}
              icon={<User size={14} />}
            />
          </div>

          {/* Rejection Feedback - Premium Alert Style */}
          {center.status === "rejected" && center.rejection_reason && (
            <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50/50 shadow-sm animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100/50 border-b border-red-100">
                <AlertCircle size={14} className="text-red-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-700">
                  Official Feedback
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium leading-relaxed text-red-900 italic">
                  "{center.rejection_reason}"
                </p>
              </div>
            </div>
          )}

          {/* Meeting Schedule Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-text-muted uppercase text-[9px] font-black tracking-widest border-b border-border-divider pb-2">
              <Calendar size={12} className="opacity-50" />
              <span>Meeting Schedule</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {center.open_days && center.open_days.length > 0 ? (
                [...new Map(center.open_days.map((schedule, index) =>

                  [`${schedule.day}-${schedule.time || ''}`, index]

                )).entries()].map(([uniqueKey, originalIndex]) => {

                  const schedule = center.open_days[originalIndex];

                  return (

                    <div

                      key={uniqueKey}

                      className="flex items-center justify-between p-3 bg-card rounded-xl border border-border-divider hover:border-primary-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-input group-hover:bg-primary-500/10 flex items-center justify-center text-text-muted group-hover:text-primary-600 transition-colors">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">
                            {schedule.day}
                          </p>
                          {schedule.date && (
                            <p className="text-[10px] text-text-muted font-bold tracking-tight">
                              {schedule.date}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-input rounded-lg text-xs font-black text-text-secondary group-hover:bg-primary-500/10 group-hover:text-primary-600 transition-colors border border-border-divider">
                        {schedule.time}
                      </div>
                    </div>
                  )
                })

              ) : (
                <div className="text-center py-6 bg-input rounded-xl border border-dashed border-border-divider">
                  <p className="text-[10px] text-text-muted uppercase font-black tracking-widest italic">
                    No schedules configured
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Address Card */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-text-muted uppercase text-[9px] font-black tracking-widest border-b border-border-divider pb-2">
              <MapPin size={12} className="opacity-50" />
              <span>Geographic Address</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed bg-input p-4 rounded-xl border border-border-divider italic font-medium">
              {center.address ||
                "No address details provided for this location."}
            </p>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="p-4 bg-table-header border-t border-border-divider flex items-center justify-between gap-3 z-10 transition-colors">
          <div className="flex-1">
            {center.status === "inactive" && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest italic">
                <Info size={10} />
                Awaiting Approval
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border-input text-text-secondary rounded-xl text-xs font-black shadow-sm hover:bg-hover transition-all"
            >
              Close
            </button>

            {onDelete &&
              (center.groups_count || 0) === 0 &&
              (center.customers_count || 0) === 0 &&
              (!isFieldOfficer || !center.open_days || center.open_days.length === 0) && (
                <button
                  onClick={() => {
                    onDelete(center.id);
                    onClose();
                  }}
                  className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Delete Request
                </button>
              )}

            {onEdit && (center.status !== "rejected" || isFieldOfficer) && (
              <button
                onClick={() => {
                  onEdit(center.id);
                  onClose();
                }}
                className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
              >
                <Edit2 size={14} />
                Edit
              </button>
            )}

            {center.status === "inactive" && onReject && (
              <button
                onClick={() => {
                  onReject(center.id);
                  onClose();
                }}
                className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <X size={14} />
                Reject Request
              </button>
            )}

            {center.status === "inactive" && onApprove && (
              <button
                onClick={() => {
                  onApprove(center.id);
                  onClose();
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors shadow-md shadow-primary-200 flex items-center gap-1.5"
              >
                <CheckCircle size={14} />
                Approve Center
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: any;
  icon: React.ReactNode;
}) {
  if (!label) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-text-muted uppercase text-[9px] font-black tracking-widest">
        <span className="opacity-50">{icon}</span>
        <span>{String(label)}</span>
      </div>
      <p className="text-sm font-bold text-text-secondary truncate">
        {value !== undefined && value !== null ? String(value) : "N/A"}
      </p>
    </div>
  );
}
