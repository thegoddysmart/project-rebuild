import { getAdminEventDetails } from "@/app/actions/admin";
import { notFound } from "next/navigation";
import { AdminEventManager } from "@/app/components/events/AdminEventManager";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEventDetailsPage(props: Props) {
  const params = await props.params;
  const event = await getAdminEventDetails(params.id);

  if (!event) {
    notFound();
  }

  // Cast or Transform event data if necessary to match AdminEventManager props
  // The structure returned by getAdminEventDetails seems to match what I defined in AdminEventManager
  // serialized Decimal values (votePrice, totalRevenue) might need checking
  // getAdminEventDetails in actions/admin.ts returns plain objects with numbers so it should proceed fine.

  // We need to ensure we pass the 'organizerId' which is available on the event object

  return (
    <AdminEventManager
      event={event as any}
      role="ADMIN"
      backUrl="/admin/events"
    />
  );
}
