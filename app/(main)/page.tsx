import Hero from "@/components/features/Hero";
import LiveEvents from "@/components/features/LiveEvents";
import LiveTickets from "@/components/features/LiveTickets";
import Partners from "@/components/features/Partners";
import Stats from "@/components/features/Stats";
import dynamic from "next/dynamic";
import { Metadata } from "next";

// Dynamically load components below the fold
const HowItWorks = dynamic(() => import("@/components/features/HowItWorks"));
const Testimonials = dynamic(
  () => import("@/components/features/Testimonials")
);
const Newsletter = dynamic(() => import("@/components/features/Newsletter"));

export const metadata: Metadata = {
  title: "EaseVote Ghana | Home",
  description:
    "The easiest way to vote for your favorite contestants and buy event tickets in Ghana. Secure, fast, and reliable.",
  alternates: {
    canonical: "https://easevotegh.com",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Hero />
      <LiveEvents />
      <LiveTickets />
      <Partners />
      <Stats />
      <HowItWorks />
      <Testimonials />
      <Newsletter />
    </main>
  );
}
