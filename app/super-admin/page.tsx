"use client";

import {
  Users,
  Calendar,
  DollarSign,
  Vote,
  TrendingUp,
  ArrowUpRight,
  Building2,
  Ticket,
} from "lucide-react";
import { KPICard, ChartCard, ActivityFeed } from "@/components/dashboard";

const revenueData = [
  { name: "Jan", revenue: 45000 },
  { name: "Feb", revenue: 52000 },
  { name: "Mar", revenue: 61000 },
  { name: "Apr", revenue: 58000 },
  { name: "May", revenue: 72000 },
  { name: "Jun", revenue: 85000 },
];

const eventTypeData = [
  { name: "Voting Events", value: 45 },
  { name: "Ticketed Events", value: 30 },
  { name: "Free Events", value: 25 },
];

const recentActivities = [
  {
    id: "1",
    title: "New organizer registered",
    description: "GH Events Ltd. completed verification",
    time: "5 minutes ago",
    user: { name: "GH Events" },
  },
  {
    id: "2",
    title: "High-value transaction",
    description: "GHS 15,000 ticket sale for Tech Summit 2024",
    time: "12 minutes ago",
    user: { name: "Tech Ghana" },
  },
  {
    id: "3",
    title: "Event milestone reached",
    description: "Miss Ghana 2024 surpassed 100,000 votes",
    time: "1 hour ago",
    user: { name: "System" },
  },
  {
    id: "4",
    title: "Payout processed",
    description: "GHS 45,000 sent to Event Masters Ghana",
    time: "2 hours ago",
    user: { name: "Finance" },
  },
  {
    id: "5",
    title: "New support ticket",
    description: "Payment dispute from customer #4521",
    time: "3 hours ago",
    user: { name: "Support" },
  },
];

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-slate-500">
            Welcome back! Here&apos;s what&apos;s happening on EaseVote today.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <TrendingUp className="h-4 w-4" />
          View Reports
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value="GHS 2.4M"
          change={12.5}
          changeLabel="vs last month"
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <KPICard
          title="Active Events"
          value="156"
          change={8.2}
          changeLabel="vs last month"
          icon={Calendar}
          iconColor="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="Total Votes Cast"
          value="1.2M"
          change={24.1}
          changeLabel="vs last month"
          icon={Vote}
          iconColor="bg-purple-100 text-purple-600"
        />
        <KPICard
          title="Registered Organizers"
          value="342"
          change={5.7}
          changeLabel="vs last month"
          icon={Building2}
          iconColor="bg-amber-100 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value="45,892"
          change={15.3}
          icon={Users}
          iconColor="bg-cyan-100 text-cyan-600"
        />
        <KPICard
          title="Tickets Sold"
          value="8,456"
          change={18.9}
          icon={Ticket}
          iconColor="bg-pink-100 text-pink-600"
        />
        <KPICard
          title="Platform Fee Earned"
          value="GHS 240K"
          change={11.2}
          icon={DollarSign}
          iconColor="bg-emerald-100 text-emerald-600"
        />
        <KPICard
          title="Pending Payouts"
          value="GHS 85K"
          change={-3.5}
          icon={ArrowUpRight}
          iconColor="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Trend"
            subtitle="Monthly revenue over the last 6 months"
            type="line"
            data={revenueData}
            dataKey="revenue"
            xAxisKey="name"
          />
        </div>
        <div>
          <ChartCard
            title="Event Distribution"
            subtitle="By event type"
            type="pie"
            data={eventTypeData}
            dataKey="value"
            xAxisKey="name"
            height={250}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Top Performing Events
              </h3>
              <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  name: "Miss Ghana 2024",
                  organizer: "Ghana Events Ltd",
                  votes: "125,432",
                  revenue: "GHS 125,432",
                },
                {
                  name: "Tech Summit Africa",
                  organizer: "Tech Ghana Foundation",
                  votes: "N/A",
                  revenue: "GHS 89,000",
                },
                {
                  name: "SRC Elections - UG",
                  organizer: "University of Ghana",
                  votes: "45,892",
                  revenue: "GHS 45,892",
                },
                {
                  name: "Afrobeats Festival",
                  organizer: "Sound Masters GH",
                  votes: "N/A",
                  revenue: "GHS 78,500",
                },
              ].map((event, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{event.name}</p>
                    <p className="text-sm text-slate-500">{event.organizer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{event.revenue}</p>
                    <p className="text-sm text-slate-500">
                      {event.votes !== "N/A" ? `${event.votes} votes` : "Tickets"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ActivityFeed activities={recentActivities} />
      </div>
    </div>
  );
}
