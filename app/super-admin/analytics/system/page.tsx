import { getSystemLogs } from "@/app/actions/super-admin";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ShieldAlert, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemLogsPage() {
  const logs = await getSystemLogs();

  const formattedLogs = logs.map((log: any) => ({
    id: log.id,
    title: log.action,
    description: `[${log.user.role}] ${log.user.name} (${log.user.email}) - ${
      log.entityType || "System"
    }`,
    time: new Date(log.createdAt).toLocaleString(),
    user: {
      name: log.user.name,
      avatar: log.user.avatar,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Logs</h1>
          <p className="text-slate-500">
            Audit trail of platform activities and security events
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <ActivityFeed
            title="Audit Log Stream"
            activities={formattedLogs}
            maxItems={50}
          />
        </div>
      </div>
    </div>
  );
}
