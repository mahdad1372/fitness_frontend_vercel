import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { Client } from "@stomp/stompjs";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import {
  fetchEquipmentStatus,
  checkInEquipment,
  checkOutEquipment,
  joinEquipmentQueue,
  leaveEquipmentQueue,
} from "../../api/resourceSchedulerApi";
import { EquipmentStatusDto } from "../../types/resourceScheduler";

// Live "gym floor" board: separate from the advance-booking flow above it
// on the page. Modeled on the same capacity + FIFO queue + push notification
// pattern the Chat feature already uses for its 2-person chatroom
// (WaitingRoom entity + a /topic/notifications broadcast that surfaces in
// the header's notification bell) - here generalized to N equipment types
// each with their own capacity > 1.
export default function EquipmentBoard() {
  const userId = Number(Cookies.get("userId"));

  const [equipment, setEquipment] = useState<EquipmentStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const status = await fetchEquipmentStatus(userId);
      setEquipment(status);
    } catch (err) {
      console.error("Error fetching equipment status:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Poll every 3s, same cadence as the existing chatroom waiting-list /
  // notification polling elsewhere in the app.
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Also react instantly to the shared /topic/notifications broadcast
  // (fired by the backend the moment any equipment frees up) instead of
  // waiting for the next poll tick.
  useEffect(() => {
    const stompClient = new Client({
      brokerURL: "ws://localhost:7000/ws",
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe("/topic/notifications", () => {
          refresh();
        });
      },
    });
    stompClient.activate();
    return () => {
      stompClient.deactivate();
    };
  }, [refresh]);

  const runAction = async (equipmentId: number, action: () => Promise<void>) => {
    setBusyId(equipmentId);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ComponentCard
      title="Live Equipment Board"
      desc="Check equipment in and out as you use it. If everything's taken, join the queue and you'll be notified the moment a unit frees up."
    >
      {loading ? (
        <div className="p-2 text-sm text-gray-400">Loading equipment...</div>
      ) : (
        <>
          {error && <div className="text-error-500 text-sm mb-3">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((e) => {
              const pctFull = e.capacity > 0 ? (e.inUse / e.capacity) * 100 : 0;
              const barColor = e.available === 0 ? "#f04438" : "#465fff";
              const isBusy = busyId === e.equipmentId;

              return (
                <div
                  key={e.equipmentId}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 dark:text-white/90">{e.name}</span>
                    <span className="text-xs text-gray-400">{e.capacity} total</span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pctFull}%`, backgroundColor: barColor }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>
                      {e.inUse} of {e.capacity} in use
                    </span>
                    <span className="font-medium" style={{ color: e.available === 0 ? "#b42318" : "#067647" }}>
                      {e.available} available
                    </span>
                  </div>

                  {e.queueLength > 0 && (
                    <div className="text-xs text-gray-400 mb-3">
                      {e.queueLength} {e.queueLength === 1 ? "person" : "people"} waiting
                    </div>
                  )}

                  {e.checkedInByMe ? (
                    <Button
                      className="w-full"
                      disabled={isBusy}
                      onClick={() => runAction(e.equipmentId, () => checkOutEquipment(e.equipmentId, userId))}
                    >
                      {isBusy ? "..." : "Done"}
                    </Button>
                  ) : e.available > 0 ? (
                    <Button
                      className="w-full"
                      disabled={isBusy}
                      onClick={() => runAction(e.equipmentId, () => checkInEquipment(e.equipmentId, userId))}
                    >
                      {isBusy ? "..." : "Start Using"}
                    </Button>
                  ) : e.myQueuePosition != null ? (
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-center font-medium text-brand-600 dark:text-brand-300">
                        {e.myQueuePosition === 1
                          ? "You're up next"
                          : `You're #${e.myQueuePosition} in queue`}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={isBusy}
                        onClick={() => runAction(e.equipmentId, () => leaveEquipmentQueue(e.equipmentId, userId))}
                      >
                        {isBusy ? "..." : "Leave Queue"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={isBusy}
                      onClick={() => runAction(e.equipmentId, () => joinEquipmentQueue(e.equipmentId, userId))}
                    >
                      {isBusy ? "..." : "Join Queue"}
                    </Button>
                  )}
                </div>
              );
            })}
            {equipment.length === 0 && (
              <div className="text-sm text-gray-400 italic">No equipment has been added yet.</div>
            )}
          </div>
        </>
      )}
    </ComponentCard>
  );
}