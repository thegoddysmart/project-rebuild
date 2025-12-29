"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Vote,
  Ticket,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  Globe,
  Lock,
  MoreHorizontal,
  Play,
  Pause,
  ExternalLink,
  Copy,
  Check,
  Scan,
} from "lucide-react";
import { clsx } from "clsx";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import EventLifecycleControls from "./EventLifecycleControls";

type Category = {
  id: string;
  name: string;
  description: string | null;
  totalVotes: number;
  candidates: Candidate[];
};

type Candidate = {
  id: string;
  code: string;
  name: string;
  image: string | null;
  voteCount: number;
};

type TicketType = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  soldCount: number;
};

type Event = {
  id: string;
  eventCode: string;
  title: string;
  description: string | null;
  type: "VOTING" | "TICKETING" | "HYBRID";
  status: string;
  coverImage: string | null;
  startDate: string;
  endDate: string;
  votePrice: number | null;
  location: string | null;
  venue: string | null;
  isPublic: boolean;
  allowNominations: boolean;
  totalVotes: number;
  totalRevenue: number;
  categories: Category[];
  ticketTypes: TicketType[];
  _count: {
    transactions: number;
    nominations: number;
  };
  createdAt: string;
  isNominationOpen: boolean;
  isVotingOpen: boolean;
  nominationStartsAt: string | null;
  nominationEndsAt: string | null;
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  showLiveResults: boolean;
  showVoteCount: boolean;
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100" },
  PENDING_REVIEW: {
    label: "Pending Review",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  APPROVED: { label: "Approved", color: "text-blue-700", bg: "bg-blue-100" },
  PUBLISHED: {
    label: "Published (Legacy)",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  LIVE: { label: "Live", color: "text-green-700", bg: "bg-green-100" },
  PAUSED: { label: "Paused", color: "text-orange-700", bg: "bg-orange-100" },
  ENDED: { label: "Ended", color: "text-slate-600", bg: "bg-slate-200" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-100" },
};

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/organizer/events/${id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch event");
        }
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
    fetchEvent();
  }, [id]);

  const refreshEvent = async () => {
    try {
      const response = await fetch(`/api/organizer/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/organizer/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete event");
      }

      router.push("/organizer/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const copyEventCode = () => {
    if (event) {
      navigator.clipboard.writeText(event.eventCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-64 animate-pulse" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-96 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-48 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error || "Event not found"}</p>
        </div>
      </div>
    );
  }

  const statusStyles = statusConfig[event.status] || statusConfig.DRAFT;
  const totalCandidates = event.categories.reduce(
    (acc, cat) => acc + cat.candidates.length,
    0
  );
  const totalTicketsSold = event.ticketTypes.reduce(
    (acc, ticket) => acc + ticket.soldCount,
    0
  );
  const totalTicketsAvailable = event.ticketTypes.reduce(
    (acc, ticket) => acc + ticket.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/organizer/events"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {event.title}
              </h1>
              <span
                className={clsx(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  statusStyles.bg,
                  statusStyles.color
                )}
              >
                {statusStyles.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={copyEventCode}
                className="flex items-center gap-1.5 font-mono text-sm bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
              >
                {event.eventCode}
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
              <span className="text-slate-400">|</span>
              <span className="text-sm text-slate-500">
                {event.type === "VOTING" && "Voting Event"}
                {event.type === "TICKETING" && "Ticketing Event"}
                {event.type === "HYBRID" && "Hybrid Event"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/organizer/events/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Revenue</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(event.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
            {event.type === "VOTING" && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Vote className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Votes</p>
                      <p className="text-lg font-bold text-slate-900">
                        {event.totalVotes.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Candidates</p>
                      <p className="text-lg font-bold text-slate-900">
                        {totalCandidates}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Categories</p>
                      <p className="text-lg font-bold text-slate-900">
                        {event.categories.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Users className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Nominations</p>
                      <p className="text-lg font-bold text-slate-900">
                        {event._count.nominations}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {event.type === "TICKETING" && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Ticket className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Tickets Sold</p>
                      <p className="text-lg font-bold text-slate-900">
                        {totalTicketsSold.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Available</p>
                      <p className="text-lg font-bold text-slate-900">
                        {(
                          totalTicketsAvailable - totalTicketsSold
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Ticket Types</p>
                      <p className="text-lg font-bold text-slate-900">
                        {event.ticketTypes.length}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {event.type === "HYBRID" && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Vote className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Votes</p>
                      <p className="text-lg font-bold text-slate-900">
                        {event.totalVotes.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Ticket className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Tickets Sold</p>
                      <p className="text-lg font-bold text-slate-900">
                        {totalTicketsSold.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Users className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Candidates</p>
                      <p className="text-lg font-bold text-slate-900">
                        {totalCandidates}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {event.description && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Description</h3>
              <p className="text-slate-600 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {event.type === "VOTING" && event.categories.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">
                  Categories & Candidates
                </h3>
                <Link
                  href={`/organizer/events/${id}/categories`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Manage Categories
                </Link>
              </div>
              <div className="space-y-4">
                {event.categories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {category.name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {category.candidates.length} candidates •{" "}
                          {category.totalVotes.toLocaleString()} votes
                        </p>
                      </div>
                    </div>
                    {category.candidates.length > 0 && (
                      <div className="divide-y divide-slate-100">
                        {category.candidates
                          .slice(0, 5)
                          .map((candidate, index) => (
                            <div
                              key={candidate.id}
                              className="px-4 py-3 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={clsx(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    index === 0
                                      ? "bg-yellow-100 text-yellow-700"
                                      : index === 1
                                      ? "bg-slate-200 text-slate-700"
                                      : index === 2
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-slate-100 text-slate-600"
                                  )}
                                >
                                  {index + 1}
                                </span>
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-sm font-medium text-primary-700">
                                  {candidate.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {candidate.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Code: {candidate.code}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900">
                                  {candidate.voteCount.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500">votes</p>
                              </div>
                            </div>
                          ))}
                        {category.candidates.length > 5 && (
                          <div className="px-4 py-2 text-center">
                            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                              View all {category.candidates.length} candidates
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.type === "TICKETING" && event.ticketTypes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Ticket Types</h3>
                <Link
                  href={`/organizer/events/${id}/edit`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Manage Tickets
                </Link>
              </div>
              <div className="space-y-3">
                {event.ticketTypes.map((ticketType) => {
                  const soldPercentage =
                    ticketType.quantity > 0
                      ? Math.round(
                          (ticketType.soldCount / ticketType.quantity) * 100
                        )
                      : 0;
                  const remaining = ticketType.quantity - ticketType.soldCount;

                  return (
                    <div
                      key={ticketType.id}
                      className="border border-slate-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {ticketType.name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {formatCurrency(ticketType.price)} per ticket
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {ticketType.soldCount.toLocaleString()} /{" "}
                            {ticketType.quantity.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">sold</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className={clsx(
                              "h-2 rounded-full transition-all",
                              soldPercentage >= 90
                                ? "bg-red-500"
                                : soldPercentage >= 70
                                ? "bg-amber-500"
                                : "bg-green-500"
                            )}
                            style={{ width: `${soldPercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {soldPercentage}% sold
                          </span>
                          <span
                            className={clsx(
                              "font-medium",
                              remaining === 0
                                ? "text-red-600"
                                : remaining <= 10
                                ? "text-amber-600"
                                : "text-green-600"
                            )}
                          >
                            {remaining === 0
                              ? "Sold Out"
                              : `${remaining.toLocaleString()} remaining`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total Tickets Sold</span>
                  <span className="font-semibold text-slate-900">
                    {totalTicketsSold.toLocaleString()} /{" "}
                    {totalTicketsAvailable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {event.type === "HYBRID" && (
            <>
              {event.categories.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                      Categories & Candidates
                    </h3>
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Manage Categories
                    </button>
                  </div>
                  <div className="space-y-4">
                    {event.categories.slice(0, 3).map((category) => (
                      <div
                        key={category.id}
                        className="border border-slate-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-slate-50 px-4 py-3">
                          <h4 className="font-medium text-slate-900">
                            {category.name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {category.candidates.length} candidates •{" "}
                            {category.totalVotes.toLocaleString()} votes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {event.ticketTypes.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                      Ticket Types
                    </h3>
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Manage Tickets
                    </button>
                  </div>
                  <div className="space-y-3">
                    {event.ticketTypes.map((ticketType) => (
                      <div
                        key={ticketType.id}
                        className="border border-slate-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {ticketType.name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {formatCurrency(ticketType.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {ticketType.soldCount} / {ticketType.quantity}
                          </p>
                          <p className="text-xs text-slate-500">sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Event Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="font-medium text-slate-900">
                    {formatDate(event.startDate)}
                  </p>
                  <p className="text-sm text-slate-600">
                    to {formatDate(event.endDate)}
                  </p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="font-medium text-slate-900">{event.venue}</p>
                    <p className="text-sm text-slate-600">{event.location}</p>
                  </div>
                </div>
              )}
              {event.votePrice && (
                <div className="flex items-start gap-3">
                  <Vote className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">Vote Price</p>
                    <p className="font-medium text-slate-900">
                      {formatCurrency(event.votePrice)} per vote
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                {event.isPublic ? (
                  <Globe className="h-5 w-5 text-slate-400 mt-0.5" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-400 mt-0.5" />
                )}
                <div>
                  <p className="text-sm text-slate-500">Visibility</p>
                  <p className="font-medium text-slate-900">
                    {event.isPublic ? "Public" : "Private"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium text-slate-900">
                    {formatDateTime(event.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {event.status === "DRAFT" && (
                <button
                  onClick={async () => {
                    // Optimistic update or simple async call
                    if (
                      !confirm(
                        "Are you sure you want to submit this event for review?"
                      )
                    )
                      return;

                    // Import logic inside component or file top
                    const { submitEventForReview } = await import(
                      "@/app/actions/organizer"
                    ); // Dynamic import to avoid build cycle if any, or just top level
                    const result = await submitEventForReview(event.id);
                    if (result.success) {
                      // Refresh handled by revalidatePath, but we updates local state to reflect immediately if needed
                      setEvent((prev) =>
                        prev ? { ...prev, status: "PENDING_REVIEW" } : null
                      );
                    } else {
                      alert(result.error);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Play className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-primary-700">
                    Submit for Review
                  </span>
                </button>
              )}

              {/* Lifecycle Controls */}
              <EventLifecycleControls
                eventId={event.id}
                status={event.status}
                type={event.type}
                nominationStartsAt={event.nominationStartsAt}
                nominationEndsAt={event.nominationEndsAt}
                votingStartsAt={event.votingStartsAt}
                votingEndsAt={event.votingEndsAt}
                showLiveResults={event.showLiveResults}
                showVoteCount={event.showVoteCount}
                onUpdate={refreshEvent}
              />
              {event.status === "LIVE" && (
                <button className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                  <Pause className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-700">
                    Pause Event
                  </span>
                </button>
              )}
              {(event.type === "TICKETING" || event.type === "HYBRID") && (
                <button
                  onClick={() => router.push(`/organizer/events/${id}/scan`)}
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                >
                  <Scan className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    Scan Tickets
                  </span>
                </button>
              )}
              <Link
                href={
                  event.type === "TICKETING"
                    ? `/events/tickets/${event.eventCode}`
                    : `/events/${event.eventCode}`
                }
                target="_blank"
                className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
              >
                <ExternalLink className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-700">
                  Preview Public Page
                </span>
              </Link>
              {(event.type === "VOTING" || event.type === "HYBRID") && (
                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                  <Users className="h-5 w-5 text-slate-600" />
                  <span className="font-medium text-slate-700">
                    Manage Candidates
                  </span>
                </button>
              )}
              {(event.type === "TICKETING" || event.type === "HYBRID") && (
                <button className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                  <Ticket className="h-5 w-5 text-slate-600" />
                  <span className="font-medium text-slate-700">
                    Manage Tickets
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.title}"? This action cannot be undone and all associated data will be permanently removed.`}
        confirmText="Delete Event"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
