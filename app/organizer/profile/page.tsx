import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileSettingsClient from "./ProfileSettingsClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/auth/signin");
  }

  // Fetch User
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      avatar: true,
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const initialData = {
    name: user.name || "",
    email: user.email || "",
  };

  return <ProfileSettingsClient initialData={initialData} />;
}
