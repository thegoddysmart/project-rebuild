import { getAdminEventDetails } from "@/app/actions/admin";
import { notFound } from "next/navigation";
import { AdminEventManager } from "@/app/components/events/AdminEventManager";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SuperAdminEventDetailsPage(props: Props) {
  const params = await props.params;
  // Reuse the same action as it fetches everything needed
  const event = await getAdminEventDetails(params.id);

  if (!event) {
    notFound();
  }

  return (
    <AdminEventManager
      event={event as any}
      role="SUPER_ADMIN"
      backUrl="/super-admin/events"
    />
  );
}
