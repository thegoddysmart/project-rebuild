import { getEventNominationForm } from "@/app/actions/nomination-form";
import FormBuilder from "./FormBuilder";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NominationSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getEventNominationForm(id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      <div>
        <Link
          href={`/organizer/events/${id}/edit`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event Settings
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Nomination Settings
          </h1>
          <p className="text-gray-500">
            Configure how candidates apply for this event.
          </p>
        </div>
      </div>

      <FormBuilder eventId={id} initialForm={form} />
    </div>
  );
}
