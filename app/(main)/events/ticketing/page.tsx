import prisma from "@/lib/db";
import Link from "next/link";
import { Calendar, MapPin, Search, ArrowRight } from "lucide-react";

async function getTicketingEvents() {
  const events = await prisma.event.findMany({
    where: {
      status: "LIVE",
      type: { in: ["TICKETING", "HYBRID"] },
    },
    include: {
      ticketTypes: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    orderBy: { startDate: "asc" },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    eventCode: event.eventCode,
    image: event.coverImage || "/placeholder-event.jpg",
    date: event.startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    venue: event.venue || event.location || "TBA",
    price:
      event.ticketTypes.length > 0
        ? Number(event.ticketTypes[0].price).toFixed(2)
        : "0.00",
  }));
}

export default async function TicketingEventsPage() {
  const events = await getTicketingEvents();

  return (
    <div className="bg-primary-900 min-h-screen pb-20">
      {/* Header */}
      <div className="border-b border-primary-600 pb-8 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white! mb-4">
            Event Tickets & Concerts
          </h1>
          <p className="text-slate-300">
            Buy Your Tickets easily and experience unforgettable live events!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((ticket) => (
            <div
              key={ticket.id}
              className="group relative bg-slate-900 rounded-2xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-2xl shadow-black/50 flex flex-col"
              style={{
                clipPath:
                  "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 95%, 10px 90%, 0 85%, 10px 80%, 0 75%, 10px 70%, 0 65%, 10px 60%, 0 55%, 10px 50%, 0 45%, 10px 40%, 0 35%, 10px 30%, 0 25%, 10px 20%, 0 15%, 10px 10%, 0 5%)",
              }}
            >
              <div className="relative h-48 bg-gray-800">
                <img
                  src={ticket.image}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  alt={ticket.title}
                />
                <div className="absolute top-4 right-4 bg-brand-bright text-white text-sm font-bold pl-3 px-3 py-1 rounded-md">
                  GHS {ticket.price}
                </div>
              </div>

              <div className="relative bg-white text-slate-900 p-6 flex-1">
                <div className="absolute -top-2 left-0 w-full h-4 bg-slate-900 ticket-stub-mask rotate-180 z-10"></div>

                <div className="pt-2">
                  <h3 className="text-xl font-bold mb-2">{ticket.title}</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-slate-600 text-sm">
                      <Calendar size={16} className="mr-2 text-magenta-600" />
                      <span>{ticket.date}</span>
                    </div>
                    <div className="flex items-center text-slate-600 text-sm">
                      <MapPin size={16} className="mr-2 text-magenta-600" />
                      <span>{ticket.venue}</span>
                    </div>
                  </div>

                  <Link
                    href={`/events/tickets/${ticket.eventCode}`}
                    className="w-full py-3 bg-secondary-700 text-white! font-bold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center group/btn"
                  >
                    Get Tickets
                    <ArrowRight
                      size={16}
                      className="ml-2 transform group-hover/btn:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-400 text-lg italic">
                No live events found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
