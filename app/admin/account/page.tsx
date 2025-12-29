import { getAdminProfile } from "@/app/actions/admin";
import AdminAccountClient from "./AdminAccountClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Account Settings | Admin Portal",
  description: "Manage your admin account settings",
};

export default async function AdminAccountPage() {
  const user = await getAdminProfile();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <AdminAccountClient user={user} />
    </div>
  );
}
