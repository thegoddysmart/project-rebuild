import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrganizationSettingsClient from "./OrganizationSettingsClient";

export default async function OrganizationPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/auth/signin");
  }

  // Fetch OrganizerProfile
  const profile = await prisma.organizerProfile.findUnique({
    where: { id: session.user.organizerId },
    select: {
      businessName: true,
      businessPhone: true,
      address: true,
      logo: true,
      // bio: true, // Check if bio exists in schema. Steps above showed businessName, businessPhone, address, city, region, logo. Maybe no bio?
      // Schema in Step 513 showed: logo, description (maybe that's bio?), website, bank details...
      // Let's use description if bio is not there.
      description: true,
    },
  });

  if (!profile) {
    redirect("/organizer/onboarding");
  }

  const initialData = {
    organizationName: profile.businessName,
    phone: profile.businessPhone || "",
    address: profile.address || "",
    bio: profile.description || "",
    logo: profile.logo || "",
  };

  return <OrganizationSettingsClient initialData={initialData} />;
}
