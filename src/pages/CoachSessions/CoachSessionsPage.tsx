import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import Select from "../../components/form/Select";
import {
  fetchSessionsByCoach,
  cancelSessionRequest,
  acceptSessionRequest,
  rejectSessionRequest,
} from "../../api/resourceSchedulerApi";
import { RecoveryEventDto, SessionRequestDto } from "../../types/resourceScheduler";

const CANCEL_REASONS = [
  { value: "Schedule conflict", label: "Schedule conflict" },
  { value: "Feeling unwell", label: "Feeling unwell" },
  { value: "Other", label: "Other" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatTimeRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${fmt(startIso)}–${fmt(endIso)}`;
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Deterministic avatar color per student, same idea as the mockup - picked
// from the id so it stays stable across refreshes rather than being random.
const AVATAR_COLORS = ["#465fff", "#12b76a", "#f79009", "#5925dc", "#f04438", "#0ea5a4"];
function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export default function CoachSessionsPage() {
  const coachId = Number(Cookies.get("userId"));

  const [sessions, setSessions] = useState<SessionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reasonByRequest, setReasonByRequest] = useState<Record<number, string>>({});
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [resultByRequest, setResultByRequest] = useState<Record<number, RecoveryEventDto>>({});

  const load = useCallback(async () => {
    try {
      const all = await fetchSessionsByCoach(coachId);
      // Upcoming only for ACCEPTED/REJECTED/CANCELLED sessions - those drop
      // off this view once their time has passed, matching the "My
      // Sessions" scope (not a full history). A PENDING request is kept
      // regardless of its original time, because nothing else ever resolves
      // it except the student re-running "Optimize Schedule" - if it were
      // filtered out here too, an unresolved request whose slot slipped
      // into the past would simply disappear with no way for the coach to
      // ever see it.
      const now = Date.now();
      const upcoming = all.filter((s) => s.status === "PENDING" || new Date(s.endTime).getTime() >= now);
      upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setSessions(upcoming);
    } catch (err) {
      console.error("Error fetching coach sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to load your sessions.");
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const s of sessions) {
      const key = dayKey(s.startTime);
      const entry = map.get(key);
      if (entry) entry.count += 1;
      else map.set(key, { label: dayLabel(s.startTime), count: 1 });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, v]) => ({ key, ...v }));
  }, [sessions]);

  useEffect(() => {
    if (!selectedDay && days.length > 0) {
      setSelectedDay(days[0].key);
    }
  }, [days, selectedDay]);

  const sessionsForSelectedDay = useMemo(
    () => sessions.filter((s) => dayKey(s.startTime) === selectedDay),
    [sessions, selectedDay]
  );

  const now = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10);
  const sessionsToday = sessions.filter((s) => dayKey(s.startTime) === todayKey).length;
  const startingSoon = sessions.filter((s) => {
    const start = new Date(s.startTime).getTime();
    return s.status === "ACCEPTED" && start > now && start - now <= 30 * 60 * 1000;
  }).length;
  const acceptedThisWeek = sessions.filter((s) => s.status === "ACCEPTED").length;

  const handleAccept = async (requestId: number) => {
    setRespondingId(requestId);
    setError(null);
    try {
      await acceptSessionRequest(requestId, coachId);
      await load();
    } catch (err) {
      console.error("Error accepting session:", err);
      setError(err instanceof Error ? err.message : "Failed to accept this session.");
    } finally {
      setRespondingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setRespondingId(requestId);
    setError(null);
    try {
      await rejectSessionRequest(requestId, coachId);
      await load();
    } catch (err) {
      console.error("Error rejecting session:", err);
      setError(err instanceof Error ? err.message : "Failed to reject this session.");
    } finally {
      setRespondingId(null);
    }
  };

  const handleCancel = async (requestId: number) => {
    const reason = reasonByRequest[requestId] || CANCEL_REASONS[0].value;
    setCancellingId(requestId);
    try {
      const event = await cancelSessionRequest(requestId, coachId, reason);
      setResultByRequest((prev) => ({ ...prev, [requestId]: event }));
      setExpandedId(null);
      await load();
    } catch (err) {
      console.error("Error cancelling session:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel this session.");
    } finally {
      setCancellingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge size="sm" color="success">Accepted</Badge>;
      case "PENDING":
        return <Badge size="sm" color="warning">Pending</Badge>;
      case "CANCELLED":
        return <Badge size="sm" color="error">Cancelled</Badge>;
      case "REJECTED":
        return <Badge size="sm" color="error">Rejected</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  return (
    <>
      <PageMeta
        title="My Sessions | Fitness - Admin Dashboard Template"
        description="Every session assigned to you, grouped by day - cancel one to automatically search for a replacement coach."
      />
      <PageBreadcrumb pageTitle="My Sessions" />

      <div className="space-y-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[160px] rounded-xl p-4 bg-[#ecf3ff] dark:bg-brand-950">
            <div className="text-2xl font-bold text-brand-600 dark:text-brand-300">{sessionsToday}</div>
            <div className="text-xs font-medium text-brand-600 dark:text-brand-300 mt-1">Sessions today</div>
          </div>
          <div className="flex-1 min-w-[160px] rounded-xl p-4 bg-warning-50 dark:bg-warning-500/10">
            <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">{startingSoon}</div>
            <div className="text-xs font-medium text-warning-600 dark:text-warning-400 mt-1">Starting within 30 min</div>
          </div>
          <div className="flex-1 min-w-[160px] rounded-xl p-4 bg-success-50 dark:bg-success-500/10">
            <div className="text-2xl font-bold text-success-600 dark:text-success-400">{acceptedThisWeek}</div>
            <div className="text-xs font-medium text-success-600 dark:text-success-400 mt-1">Accepted &amp; upcoming</div>
          </div>
        </div>

        <ComponentCard
          title="Upcoming sessions"
          desc="Cancelling an accepted session automatically looks for another coach free at the exact same time. Equipment and the student's time never change - only the coach does."
        >
          {loading ? (
            <div className="p-2 text-sm text-gray-400">Loading your sessions...</div>
          ) : (
            <>
              {error && <div className="text-error-500 text-sm mb-3">{error}</div>}

              {days.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {days.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedDay(d.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border ${
                        selectedDay === d.key
                          ? "bg-brand-500 text-white border-brand-500"
                          : "bg-white text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
                      }`}
                    >
                      {d.label}
                      <span className={`ml-1.5 text-xs ${selectedDay === d.key ? "text-white/80" : "text-gray-400"}`}>
                        ({d.count})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {sessionsForSelectedDay.length === 0 ? (
                <div className="text-sm text-gray-400 italic">
                  {sessions.length === 0 ? "You have no upcoming sessions." : "Nothing scheduled for this day."}
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {sessionsForSelectedDay.map((s) => {
                    const startMs = new Date(s.startTime).getTime();
                    const endMs = new Date(s.endTime).getTime();
                    const inProgress = startMs <= now && now < endMs;
                    const canCancel = s.status === "ACCEPTED" && startMs > now;
                    const result = resultByRequest[s.requestId];

                    return (
                      <div key={s.requestId} className="py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: avatarColor(s.studentId) }}
                          >
                            {initials(s.studentName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap text-sm font-semibold text-gray-800 dark:text-white/90">
                              {s.studentName}
                              {inProgress && <Badge size="sm" color="info">In progress</Badge>}
                              {!inProgress && statusBadge(s.status)}
                              {s.cappedForRisk && <Badge size="sm" color="warning">Risk-capped</Badge>}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {s.equipmentName ? `${s.equipmentName} · ` : ""}
                              {formatTimeRange(s.startTime, s.endTime)}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {inProgress ? (
                              <span className="text-xs text-gray-400">Already started</span>
                            ) : s.status === "PENDING" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAccept(s.requestId)}
                                  disabled={respondingId === s.requestId}
                                  className="text-xs font-semibold text-success-600 bg-success-50 dark:bg-success-500/15 dark:text-success-400 rounded-full px-3 py-1.5 whitespace-nowrap disabled:opacity-60"
                                >
                                  {respondingId === s.requestId ? "..." : "Accept"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(s.requestId)}
                                  disabled={respondingId === s.requestId}
                                  className="text-xs font-semibold text-error-600 bg-error-50 dark:bg-error-500/15 dark:text-error-400 rounded-full px-3 py-1.5 whitespace-nowrap disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : canCancel ? (
                              <button
                                type="button"
                                onClick={() => setExpandedId(expandedId === s.requestId ? null : s.requestId)}
                                className="text-xs font-semibold text-error-600 bg-error-50 dark:bg-error-500/15 dark:text-error-400 rounded-full px-3 py-1.5 whitespace-nowrap"
                              >
                                {expandedId === s.requestId ? "Close" : "Cancel"}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {expandedId === s.requestId && (
                          <div className="mt-3 ml-12 rounded-lg border border-error-200 bg-error-50 dark:border-error-500/20 dark:bg-error-500/10 p-3">
                            <div className="text-xs font-semibold text-error-600 dark:text-error-400 mb-2">
                              Cancel session with {s.studentName}? {formatTimeRange(s.startTime, s.endTime)}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="w-48">
                                <Select
                                  options={CANCEL_REASONS}
                                  defaultValue={CANCEL_REASONS[0].value}
                                  onChange={(v) => setReasonByRequest((prev) => ({ ...prev, [s.requestId]: v }))}
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleCancel(s.requestId)}
                                disabled={cancellingId === s.requestId}
                              >
                                {cancellingId === s.requestId ? "Cancelling..." : "Confirm cancellation"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>
                                Keep session
                              </Button>
                            </div>
                            <p className="text-xs text-error-600 dark:text-error-400 mt-2">
                              Confirming will notify {s.studentName.split(" ")[0]} and automatically start looking
                              for another coach at the same time.
                            </p>
                          </div>
                        )}

                        {result && (
                          <div
                            className={`mt-3 ml-12 rounded-lg p-3 text-xs ${
                              result.status === "COMPLETED"
                                ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                                : "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
                            }`}
                          >
                            {result.status === "COMPLETED"
                              ? `Reassigned to ${result.newCoachName} - same time slot.`
                              : result.message || "No replacement coach was found."}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
