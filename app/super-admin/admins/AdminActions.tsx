"use client";

import { useTransition } from "react";
import { updateUserStatus, removeAdmin } from "@/app/actions/super-admin";
import { Ban, Trash2, CheckCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminActionProps {
  id: string;
  status: string;
  name: string;
}

export default function AdminActions({ admin }: { admin: AdminActionProps }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSuspend = () => {
    const isSuspended = admin.status === "SUSPENDED";
    const newStatus = isSuspended ? "ACTIVE" : "SUSPENDED";

    if (
      confirm(
        isSuspended
          ? "Activate this admin account?"
          : "Suspend this admin account? They will not be able to login."
      )
    ) {
      startTransition(async () => {
        const result = await updateUserStatus(admin.id, newStatus);
        if (!result.success) {
          alert(result.message);
        }
      });
    }
  };

  const handleRemove = () => {
    if (
      confirm(
        `Are you sure you want to PERMANENTLY remove admin "${admin.name}"? This cannot be undone.`
      )
    ) {
      startTransition(async () => {
        const result = await removeAdmin(admin.id);
        if (result.success) {
          router.push("/super-admin/admins");
        } else {
          alert(result.message);
        }
      });
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSuspend}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors text-sm font-medium border ${
          admin.status === "SUSPENDED"
            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            : "bg-white border-slate-200 text-amber-600 hover:bg-amber-50"
        }`}
      >
        {admin.status === "SUSPENDED" ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Activate
          </>
        ) : (
          <>
            <Ban className="w-4 h-4" />
            Suspend
          </>
        )}
      </button>

      <button
        onClick={handleRemove}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
        Remove
      </button>
    </div>
  );
}
