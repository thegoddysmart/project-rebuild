import { getNominations } from "@/app/actions/nomination";
import NominationsTable from "./NominationsTable";
import Link from "next/link";
import { Settings } from "lucide-react";

export default async function NominationsPage({
  params,
}: {
  params: { id: string };
}) {
  const nominations = await getNominations(params.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Nominations
          </h1>
          <p className="text-gray-500">
            Manage and review candidate applications.
          </p>
        </div>
        <Link
          href={`/organizer/events/${params.id}/nominations/settings`}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-bold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Settings size={18} /> Settings & Form
        </Link>
      </div>

      <NominationsTable nominations={nominations} eventId={params.id} />
    </div>
  );
}
