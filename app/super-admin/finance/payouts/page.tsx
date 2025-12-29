import { Suspense } from "react";
import { getGlobalPayouts } from "@/app/actions/super-admin";
import PayoutsTable from "@/components/super-admin/finance/PayoutsTable";

export const dynamic = "force-dynamic";

export default async function SuperAdminPayoutsPage() {
  const payouts = await getGlobalPayouts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Requests</h1>
          <p className="text-sm text-gray-500">
            Manage organizer withdrawal requests.
          </p>
        </div>
      </div>

      <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
        <PayoutsTable payouts={payouts} />
      </div>
    </div>
  );
}
