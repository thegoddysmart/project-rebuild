"use client";

import { useState } from "react";
import { updateSystemSetting } from "@/app/actions/settings";
import { Loader2, Save, LucideIcon, Check, X } from "lucide-react";
import { useSession } from "next-auth/react";

type SettingItem = {
  key: string;
  label: string;
  description: string;
  type: string;
  value: any;
  // icon: LucideIcon; // Removed to avoid serialization error
};

export default function SettingsForm({
  item,
  iconNode,
}: {
  item: SettingItem;
  iconNode: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [value, setValue] = useState(item.value);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    // In a real app, you'd validate input here
    const res = await updateSystemSetting(
      item.key,
      value,
      session?.user?.email || "unknown"
    );

    setLoading(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Failed to save setting");
    }
  };

  return (
    <div className="p-6 flex items-start gap-4">
      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
          {iconNode}
        </div>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-900 mb-1">
          {item.label}
        </label>
        <p className="text-sm text-slate-500 mb-3">{item.description}</p>

        <div className="flex items-center gap-3">
          {item.type === "boolean" ? (
            <button
              onClick={() => setValue(!value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                value ? "bg-green-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`${
                  value ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          ) : (
            <input
              type={item.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) =>
                setValue(
                  item.type === "number"
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-blue-500"
            />
          )}

          <button
            onClick={handleSave}
            disabled={loading || value === item.value}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                ${
                  value === item.value
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }
            `}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <>
                <Check className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
