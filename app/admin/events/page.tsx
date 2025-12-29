import { getAdminEvents } from "@/app/actions/admin";
import EventsTable from "./EventsTable";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminEventsPage(props: Props) {
  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const type =
    typeof searchParams.type === "string" ? searchParams.type : undefined;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : undefined;

  const events = await getAdminEvents({ status, type, query });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Events Management
          </h1>
          <p className="text-slate-500">
            Monitor and manage all events across the platform.
          </p>
        </div>
      </div>

      <EventsTable events={events} />
    </div>
  );
}
