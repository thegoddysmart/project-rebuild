import { getAdmins } from "@/app/actions/super-admin";
import AdminsTable from "./AdminsTable";
import CreateAdminButton from "./CreateAdminButton";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminManagementPage() {
  const admins = await getAdmins();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Management
          </h1>
          <p className="text-slate-500">
            Manage platform administrators and their access levels.
          </p>
        </div>
        <CreateAdminButton />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Platform Administrators
          </h3>
          <span className="text-sm text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full shadow-sm">
            {admins.length} Active
          </span>
        </div>
        <AdminsTable admins={admins} />
      </div>
    </div>
  );
}
