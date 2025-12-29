import { getGlobalEvents } from "@/app/actions/super-admin";
import GlobalEventsTable from "../events/GlobalEventsTable";
import { Ticket } from "lucide-react";

export default async function TicketingEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const query =
    typeof resolvedParams.query === "string" ? resolvedParams.query : undefined;
  const status =
    typeof resolvedParams.status === "string"
      ? resolvedParams.status
      : undefined;

  const events = await getGlobalEvents({
    query,
    status,
    type: "TICKETING",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <Ticket className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Ticketing Events
          </h1>
          <p className="text-slate-500">Manage all ticketing-related events</p>
        </div>
      </div>

      <GlobalEventsTable events={events} />
    </div>
  );
}
