import { getGatewayConfigs } from "@/app/actions/gateway";
import GatewaySettings from "@/components/super-admin/finance/GatewaySettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const configs = await getGatewayConfigs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Settings</h1>
        <p className="text-sm text-gray-500">
          Control active payment gateways and monitoring thresholds.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <GatewaySettings configs={configs} />
      </div>
    </div>
  );
}
