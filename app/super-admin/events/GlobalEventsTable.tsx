"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DataTable } from "@/components/dashboard";
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Vote,
  Ticket,
  Calendar,
  Ban,
  PauseCircle,
  Search,
  Filter,
  X,
  Archive,
  RotateCcw,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import {
  updateEventStatus,
  archiveEvent,
  restoreEvent,
} from "@/app/actions/admin";

type GlobalEvent = {
  id: string;
  eventCode: string;
  title: string;
  organizer: {
    name: string;
    avatar: string;
  };
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  stats: {
    votes?: number;
    revenue?: number;
  };
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  PENDING_REVIEW: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: AlertCircle,
  },
  APPROVED: {
    label: "Approved",
    color: "text-blue-700",
    bg: "bg-blue-100",
    icon: CheckCircle,
  },
  LIVE: {
    label: "Live",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: CheckCircle,
  },
  ENDED: {
    label: "Ended",
    color: "text-slate-600",
    bg: "bg-slate-100",
    icon: CheckCircle,
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-gray-500",
    bg: "bg-gray-100",
    icon: Archive,
  },
  DRAFT: {
    label: "Draft",
    color: "text-slate-500",
    bg: "bg-slate-100",
    icon: MoreHorizontal,
  },
  PAUSED: {
    label: "Paused",
    color: "text-orange-700",
    bg: "bg-orange-100",
    icon: PauseCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: Ban,
  },
};

const typeConfig: Record<string, { label: string; icon: any; color: string }> =
  {
    VOTING: { label: "Voting", icon: Vote, color: "text-purple-600" },
    TICKETING: { label: "Ticketing", icon: Ticket, color: "text-blue-600" },
    HYBRID: { label: "Hybrid", icon: Calendar, color: "text-orange-600" },
  };

export default function GlobalEventsTable({
  events,
}: {
  events: GlobalEvent[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);

  // Archival Modal State
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({ isOpen: false, eventId: null, eventTitle: "" });
  const [pruneData, setPruneData] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("query") || ""
  );
  const statusFilter = searchParams.get("status") || "all";
  const typeFilter = searchParams.get("type") || "all";
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search update
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams);
    if (query) params.set("query", query);
    else params.delete("query");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleAction = async (action: string, eventId: string) => {
    setActiveMenu(null);
    setPending(true);

    try {
      if (action === "archive_prompt") {
        const event = events.find((e) => e.id === eventId);
        setArchiveModal({
          isOpen: true,
          eventId,
          eventTitle: event?.title || "Event",
        });
        setPruneData(false);
        setPending(false);
        return;
      }

      if (action === "restore") {
        const result = await restoreEvent(eventId);
        if (!result.success) alert("Failed to restore event");
        else router.refresh();
        setPending(false);
        return;
      }

      if (action === "suspend") {
        const result = await updateEventStatus(eventId, "PAUSED");
        if (!result.success) alert("Failed to suspend event");
        else router.refresh();
        setPending(false);
        return;
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setPending(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveModal.eventId) return;
    setPending(true);
    try {
      const result = await archiveEvent(archiveModal.eventId!, pruneData);
      if (!result.success) {
        alert("Failed to archive event");
      } else {
        router.refresh();
      }
      setArchiveModal({ isOpen: false, eventId: null, eventTitle: "" });
    } finally {
      setPending(false);
    }
  };

  const headers = [
    {
      key: "title",
      header: "Event Info",
      render: (event: GlobalEvent) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
            {(() => {
              const Icon = typeConfig[event.type]?.icon || Calendar;
              return <Icon className="h-5 w-5" />;
            })()}
          </div>
          <div>
            <div
              className="font-medium text-slate-900 line-clamp-1"
              title={event.title}
            >
              {event.title}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {event.eventCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "organizer",
      header: "Organizer",
      render: (event: GlobalEvent) => (
        <div className="flex items-center gap-2 max-w-[180px]">
          <div className="h-6 w-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ring-white shrink-0">
            {(event.organizer.avatar || "").length > 2 ? (
              event.organizer.avatar.startsWith("http") ? (
                <img
                  src={event.organizer.avatar}
                  alt={event.organizer.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                (event.organizer.name || "O").substring(0, 1)
              )
            ) : (
              (event.organizer.name || "O").substring(0, 1)
            )}
          </div>
          <span
            className="text-sm text-slate-700 truncate"
            title={event.organizer.name}
          >
            {event.organizer.name}
          </span>
        </div>
      ),
    },
    {
      key: "stats",
      header: "Performance",
      render: (event: GlobalEvent) => (
        <div className="text-sm">
          <div className="font-medium text-slate-900">
            {new Intl.NumberFormat("en-GH", {
              style: "currency",
              currency: "GHS",
              minimumFractionDigits: 0,
            }).format(event.stats.revenue || 0)}
          </div>
          <div className="text-xs text-slate-500">
            {event.stats.votes?.toLocaleString() || 0} votes
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (event: GlobalEvent) => {
        const config = typeConfig[event.type] || {
          label: event.type,
          icon: Calendar,
          color: "text-slate-600",
        };
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className={clsx("h-4 w-4", config.color)} />
            <span className="text-sm text-slate-600">{config.label}</span>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      render: (event: GlobalEvent) => (
        <div className="flex flex-col text-sm text-slate-600">
          <span>{new Date(event.startDate).toLocaleDateString()}</span>
          <span className="text-xs text-slate-400">
            to {new Date(event.endDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (event: GlobalEvent) => {
        const config = statusConfig[event.status] || {
          label: event.status,
          bg: "bg-gray-100",
          color: "text-gray-600",
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
          >
            {config.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search query..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => updateFilters("status", e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="LIVE">Live</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="ENDED">Ended</option>
              <option value="ARCHIVED">Archived</option>
              <option value="CANCELLED">Cancelled/Suspended</option>
            </select>
          </div>
        )}
      </div>

      <DataTable
        data={events}
        columns={headers}
        searchable={false}
        actions={(event) => (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === event.id ? null : event.id);
              }}
              className="p-1 hover:bg-slate-100 rounded text-slate-400"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {activeMenu === event.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50">
                <Link
                  href={`/super-admin/events/${event.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" /> View Details
                </Link>
                {event.status === "LIVE" && (
                  <button
                    onClick={() => handleAction("suspend", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4" /> Suspend Event
                  </button>
                )}
                {(event.status === "ENDED" || event.status === "LIVE") && (
                  <button
                    onClick={() => handleAction("archive_prompt", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </button>
                )}

                {event.status === "ARCHIVED" && (
                  <button
                    onClick={() => handleAction("restore", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  >
                    <RotateCcw className="h-4 w-4" /> Restore
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      />

      {/* Archive Modal */}
      {archiveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <Archive size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Archive Event?
                </h3>
                <p className="text-slate-600 mt-1">
                  Are you sure you want to archive{" "}
                  <strong>{archiveModal.eventTitle}</strong>? It will be hidden
                  from the main dashboard.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-red-500 checked:bg-red-500"
                    checked={pruneData}
                    onChange={(e) => setPruneData(e.target.checked)}
                  />
                  <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 peer-checked:opacity-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-slate-900 block text-sm">
                    Prune Vote Data (Irreversible)
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Check this to **permanently delete** all vote records for
                    this event to free up database space. Metadata stays.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() =>
                  setArchiveModal({
                    isOpen: false,
                    eventId: null,
                    eventTitle: "",
                  })
                }
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-2"
              >
                {isPending ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
