import { getFAQs } from "@/app/actions/cms";
import FAQManager from "./FAQManager";

export const dynamic = "force-dynamic";

export default async function FAQsPage() {
  const faqs = await getFAQs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">FAQ Management</h1>
        <p className="text-sm text-gray-500">
          Create, edit, and manage frequently asked questions for the public
          site.
        </p>
      </div>

      <FAQManager initialFaqs={faqs} />
    </div>
  );
}
