import { getGlobalEvents } from "@/app/actions/super-admin";
import GlobalEventsTable from "../events/GlobalEventsTable";
import { Vote } from "lucide-react";

export default async function VotingEventsPage({
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
    type: "VOTING",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
          <Vote className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voting Events</h1>
          <p className="text-slate-500">Manage all voting-related events</p>
        </div>
      </div>

      <GlobalEventsTable events={events} />
    </div>
  );
}
