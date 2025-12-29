"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Phone,
  MapPin,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface OrganizationData {
  organizationName: string;
  phone: string;
  address: string;
}

export default function OrganizationSettingsClient({
  initialData,
}: {
  initialData: OrganizationData;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // We can use the same API endpoint since it accepts partial updates
    try {
      const res = await fetch("/api/organizer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update organization");

      setMessage({
        type: "success",
        text: "Organization details updated successfully!",
      });
      router.refresh();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Failed to save changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Organization Profile
        </h1>
        <p className="text-slate-500">
          Manage your agency/company specific information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold border-b border-gray-100 pb-4">
            <Building2 size={20} className="text-primary-600" />
            <h2>Organization Details</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm mb-6">
              <Info className="shrink-0" size={20} />
              <p>
                These details will be displayed on ticket receipts and event
                pages to help attendees contact you.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 font-bold text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Support Phone
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 font-bold text-slate-800"
                    placeholder="+233..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Address / Location
                </label>
                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 font-bold text-slate-800"
                    placeholder="Accra, Ghana"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <p className="font-bold text-sm">{message.text}</p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} /> Save Details
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
