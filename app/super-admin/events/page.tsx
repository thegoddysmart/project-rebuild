import { getGlobalEvents } from "@/app/actions/super-admin";
import GlobalEventsTable from "./GlobalEventsTable";
import { FolderSearch } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SuperAdminEventsPage(props: Props) {
  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const type =
    typeof searchParams.type === "string" ? searchParams.type : undefined;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : undefined;

  const events = await getGlobalEvents({ status, type, query });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderSearch className="h-7 w-7 text-indigo-600" />
            Global Events
          </h1>
          <p className="text-slate-500">
            Monitor and manage all events across the platform.
          </p>
        </div>
      </div>

      <GlobalEventsTable events={events} />
    </div>
  );
}
