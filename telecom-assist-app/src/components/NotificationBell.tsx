import { useEffect, useState, useRef } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { notificationsApi, type NotificationItem } from "@/lib/api";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        notificationsApi.getAll(),
        notificationsApi.getUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count.count);
    } catch {
      // User might not be logged in or endpoint unavailable
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    setMarking(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setMarking(false);
    }
  }

  async function handleMarkOne(id: string) {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className="relative p-2 rounded-md hover:bg-accent"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-prio-high text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border bg-card shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={marking}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-60"
              >
                {marking ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Chargement…
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune notification.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    if (!n.read) handleMarkOne(n._id);
                  }}
                  className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-accent/50 transition ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-prio-high shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
