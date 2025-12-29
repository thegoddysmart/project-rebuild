"use client";

import { useTransition } from "react";
import { verifyOrganizer, updateUserStatus } from "@/app/actions/admin";
import { CheckCircle, XCircle, Ban, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrganizerActionProps {
  id: string;
  verified: boolean;
  user: {
    id: string;
    status: string;
  };
}

export default function OrganizerActions({
  organizer,
}: {
  organizer: OrganizerActionProps;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleVerify = (verified: boolean) => {
    if (
      confirm(
        verified
          ? "Mark this organizer as verified?"
          : "Revoke verification status?"
      )
    ) {
      startTransition(async () => {
        await verifyOrganizer(organizer.id, verified);
      });
    }
  };

  const handleSuspend = () => {
    const isSuspended = organizer.user.status === "SUSPENDED";
    const newStatus = isSuspended ? "ACTIVE" : "SUSPENDED";

    if (
      confirm(
        isSuspended
          ? "Activate this account?"
          : "Suspend this account? User will not be able to login."
      )
    ) {
      startTransition(async () => {
        await updateUserStatus(organizer.user.id, newStatus);
      });
    }
  };

  return (
    <div className="flex gap-2">
      {!organizer.verified ? (
        <button
          onClick={() => handleVerify(true)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Verify Account
        </button>
      ) : (
        <button
          onClick={() => handleVerify(false)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <XCircle className="w-4 h-4" />
          Revoke Verification
        </button>
      )}

      <button
        onClick={handleSuspend}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors text-sm font-medium border ${
          organizer.user.status === "SUSPENDED"
            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            : "bg-white border-slate-200 text-red-600 hover:bg-red-50"
        }`}
      >
        <Ban className="w-4 h-4" />
        {organizer.user.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
      </button>
    </div>
  );
}
