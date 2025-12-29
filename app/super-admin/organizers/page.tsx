import { getSuperAdminOrganizers } from "@/app/actions/super-admin";
import OrganizersTable from "./OrganizersTable";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminOrganizersPage() {
  const organizers = await getSuperAdminOrganizers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Organizer Management
        </h1>
        <p className="text-slate-500">
          Full control over organizer accounts, verification, and commissions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            All Organizers
          </h3>
          <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {organizers.length} Total
          </span>
        </div>
        <OrganizersTable organizers={organizers} />
      </div>
    </div>
  );
}
