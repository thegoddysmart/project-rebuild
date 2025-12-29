import { getFAQs } from "@/app/actions/cms";
import DidYouKnow from "./DidYouKnow";
import FAQAccordion from "./FAQAccordion";
import VideoGuides from "./VideoGuides";

export default async function Faq() {
  const faqs = await getFAQs();
  const faqItems = faqs.map((f) => ({
    id: f.id,
    question: f.content.question,
    answer: f.content.answer,
    category: f.content.category,
  }));

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">
          Did You Know?
        </h2>
      </div>
      <DidYouKnow />
      <FAQAccordion items={faqItems} />
      <VideoGuides />

      <div className="mt-20 text-center bg-secondary-50 rounded-3xl p-12">
        <h3 className="text-2xl font-bold text-secondary-900 mb-3">
          Still have questions?
        </h3>
        <p className="text-secondary-700 mb-8">
          Can&apos;t find the answer you&apos;re looking for? Please chat to our
          friendly team.
        </p>
        <button className="bg-secondary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-secondary-700 transition-colors shadow-lg shadow-secondary-600/20">
          Contact Support
        </button>
      </div>
    </section>
  );
}
