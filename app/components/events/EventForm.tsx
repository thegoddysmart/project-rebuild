"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  MapPin,
  Vote,
  Globe,
  Lock,
  Image as ImageIcon,
  AlertCircle,
  Ticket,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { clsx } from "clsx";

type TicketTypeForm = {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
  maxPerOrder: string;
  soldCount: number;
  isNew?: boolean;
};

type Event = {
  id: string;
  eventCode: string;
  title: string;
  description: string | null;
  type: "VOTING" | "TICKETING" | "HYBRID";
  status: string;
  coverImage: string | null;
  bannerImage: string | null;
  startDate: string;
  endDate: string;
  votePrice: number | null;
  minVotes: number;
  maxVotes: number | null;
  location: string | null;
  venue: string | null;
  isPublic: boolean;
  allowNominations: boolean;
  nominationDeadline: string | null;
  ticketTypes?: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    quantity: number;
    soldCount: number;
    maxPerOrder: number;
  }>;
};

interface EventFormProps {
  eventId: string;
  backUrl?: string; // Where to go on cancel/back (e.g. /organizer/events or /admin/events)
}

export function EventForm({ eventId, backUrl }: EventFormProps) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "VOTING" as "VOTING" | "TICKETING" | "HYBRID",
    startDate: "",
    endDate: "",
    votePrice: "",
    minVotes: "1",
    maxVotes: "",
    location: "",
    venue: "",
    isPublic: true,
    allowNominations: false,
    coverImage: "", // Added coverImage field that was missing in original state but present in props
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addTicketType = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        description: "",
        price: "",
        quantity: "",
        maxPerOrder: "10",
        soldCount: 0,
        isNew: true,
      },
    ]);
  };

  const updateTicketType = (
    id: string,
    field: keyof TicketTypeForm,
    value: string | number
  ) => {
    setTicketTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const removeTicketType = (id: string) => {
    const ticket = ticketTypes.find((t) => t.id === id);
    if (ticket && ticket.soldCount > 0) {
      setError("Cannot remove a ticket type that has sales");
      return;
    }
    if (ticketTypes.length > 1) {
      setTicketTypes((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/organizer/events/${eventId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch event");
        }
        const data = await response.json();
        setEvent(data);

        setFormData({
          title: data.title || "",
          description: data.description || "",
          type: data.type || "VOTING",
          startDate: data.startDate ? formatDateForInput(data.startDate) : "",
          endDate: data.endDate ? formatDateForInput(data.endDate) : "",
          votePrice: data.votePrice?.toString() || "",
          minVotes: data.minVotes?.toString() || "1",
          maxVotes: data.maxVotes?.toString() || "",
          location: data.location || "",
          venue: data.venue || "",
          isPublic: data.isPublic ?? true,
          allowNominations: data.allowNominations ?? false,
          coverImage: data.coverImage || "",
        });

        if (data.ticketTypes && data.ticketTypes.length > 0) {
          setTicketTypes(
            data.ticketTypes.map(
              (t: {
                id: string;
                name: string;
                description: string | null;
                price: number;
                quantity: number;
                soldCount: number;
                maxPerOrder: number;
              }) => ({
                id: t.id,
                name: t.name,
                description: t.description || "",
                price: t.price.toString(),
                quantity: t.quantity.toString(),
                maxPerOrder: t.maxPerOrder?.toString() || "10",
                soldCount: t.soldCount || 0,
                isNew: false,
              })
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        ...formData,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : undefined,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        votePrice: formData.votePrice ? parseFloat(formData.votePrice) : null,
        minVotes: parseInt(formData.minVotes) || 1,
        maxVotes: formData.maxVotes ? parseInt(formData.maxVotes) : null,
      };

      if (formData.type === "TICKETING" || formData.type === "HYBRID") {
        payload.ticketTypes = ticketTypes.map((t) => ({
          id: t.isNew ? undefined : t.id,
          name: t.name,
          description: t.description || null,
          price: parseFloat(t.price),
          quantity: parseInt(t.quantity),
          maxPerOrder: parseInt(t.maxPerOrder) || 10,
        }));
      }

      const response = await fetch(`/api/organizer/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update event");
      }

      setSuccess("Event updated successfully!");
      // Don't auto-redirect on success for component, let user decide or just show success
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 h-96 animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error || "Event not found"}</p>
        </div>
      </div>
    );
  }

  const isLive = event.status === "LIVE";
  const backHref = backUrl || `/organizer/events/${eventId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Event</h1>
            <p className="text-slate-500">{event.title}</p>
          </div>
        </div>
      </div>

      {isLive && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            This event is currently live. Only certain fields can be edited. To
            make major changes, please pause the event first.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isLive}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <ImageIcon className="h-4 w-4 inline mr-1" />
                Cover Image URL
              </label>
              <input
                type="url"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {formData.coverImage && (
                <div className="mt-2 relative w-full h-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={formData.coverImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Event Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isLive}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="VOTING">Voting</option>
                  <option value="TICKETING">Ticketing</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Visibility
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, isPublic: true }))
                      }
                      className="w-4 h-4 text-primary-600"
                    />
                    <Globe className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      checked={!formData.isPublic}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, isPublic: false }))
                      }
                      className="w-4 h-4 text-primary-600"
                    />
                    <Lock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Private</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={isLive}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                disabled={isLive}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., National Theatre"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City / Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Accra, Ghana"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {(formData.type === "VOTING" || formData.type === "HYBRID") && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Voting Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vote Price (GHS)
                </label>
                <input
                  type="number"
                  name="votePrice"
                  value={formData.votePrice}
                  onChange={handleChange}
                  disabled={isLive}
                  step="0.01"
                  min="0"
                  placeholder="1.00"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Min Votes per Transaction
                </label>
                <input
                  type="number"
                  name="minVotes"
                  value={formData.minVotes}
                  onChange={handleChange}
                  disabled={isLive}
                  min="1"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Votes per Transaction
                </label>
                <input
                  type="number"
                  name="maxVotes"
                  value={formData.maxVotes}
                  onChange={handleChange}
                  disabled={isLive}
                  min="1"
                  placeholder="Unlimited"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowNominations"
                  checked={formData.allowNominations}
                  onChange={handleChange}
                  disabled={isLive}
                  className="w-4 h-4 text-primary-600 rounded disabled:cursor-not-allowed"
                />
                <span className="text-sm text-slate-700">
                  Allow public nominations for this event
                </span>
              </label>

              {formData.allowNominations && (
                <div className="pl-7">
                  <Link
                    href={`/organizer/events/${eventId}/nominations/settings`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                  >
                    Configure Nomination Form & WhatsApp Link{" "}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <p className="text-xs text-slate-500 mt-1">
                    Edit the form fields and WhatsApp group link in the
                    nomination settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {(formData.type === "TICKETING" || formData.type === "HYBRID") && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Ticket Types
                </h3>
                <p className="text-sm text-slate-500">
                  Manage ticket tiers with their own prices and quantities
                </p>
              </div>
              {!isLive && (
                <button
                  type="button"
                  onClick={addTicketType}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Ticket Type
                </button>
              )}
            </div>

            {ticketTypes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Ticket className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No ticket types configured</p>
                <button
                  type="button"
                  onClick={addTicketType}
                  className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add your first ticket type
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {ticketTypes.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500">
                          Ticket Type {index + 1}
                        </span>
                        {ticket.soldCount > 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            {ticket.soldCount} sold
                          </span>
                        )}
                      </div>
                      {ticketTypes.length > 1 &&
                        !isLive &&
                        ticket.soldCount === 0 && (
                          <button
                            type="button"
                            onClick={() => removeTicketType(ticket.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={ticket.name}
                          onChange={(e) =>
                            updateTicketType(ticket.id, "name", e.target.value)
                          }
                          disabled={isLive && ticket.soldCount > 0}
                          placeholder="e.g., Regular, VIP, VVIP"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={ticket.description}
                          onChange={(e) =>
                            updateTicketType(
                              ticket.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Standard entry, Front row access"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Price (GHS) *
                        </label>
                        <input
                          type="number"
                          value={ticket.price}
                          onChange={(e) =>
                            updateTicketType(ticket.id, "price", e.target.value)
                          }
                          disabled={isLive}
                          step="0.01"
                          min="0"
                          placeholder="200.00"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={ticket.quantity}
                            onChange={(e) =>
                              updateTicketType(
                                ticket.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            disabled={
                              isLive &&
                              parseInt(ticket.quantity) <= ticket.soldCount
                            }
                            min={ticket.soldCount || 1}
                            placeholder="500"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Max per Order
                          </label>
                          <input
                            type="number"
                            value={ticket.maxPerOrder}
                            onChange={(e) =>
                              updateTicketType(
                                ticket.id,
                                "maxPerOrder",
                                e.target.value
                              )
                            }
                            min="1"
                            placeholder="10"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {/* <Link
            href={backHref}
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link> */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
