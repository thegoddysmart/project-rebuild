"use client";

import {
  Calendar,
  DollarSign,
  Vote,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { KPICard, ChartCard, ActivityFeed } from "@/components/dashboard";

const weeklyEventsData = [
  { name: "Mon", events: 12 },
  { name: "Tue", events: 18 },
  { name: "Wed", events: 15 },
  { name: "Thu", events: 22 },
  { name: "Fri", events: 28 },
  { name: "Sat", events: 35 },
  { name: "Sun", events: 20 },
];

const recentActivities = [
  {
    id: "1",
    title: "Event approved",
    description: "Youth Leaders Award 2024 is now live",
    time: "10 minutes ago",
    user: { name: "Admin" },
  },
  {
    id: "2",
    title: "Payout request reviewed",
    description: "GHS 25,000 approved for GH Events Ltd.",
    time: "30 minutes ago",
    user: { name: "Admin" },
  },
  {
    id: "3",
    title: "Support ticket resolved",
    description: "Ticket #4521 marked as resolved",
    time: "1 hour ago",
    user: { name: "Support" },
  },
  {
    id: "4",
    title: "New organizer verification",
    description: "Accra Events Co. submitted documents",
    time: "2 hours ago",
    user: { name: "System" },
  },
];

const pendingApprovals = [
  {
    id: "1",
    name: "Campus Music Awards 2024",
    organizer: "UCC Events",
    type: "Voting",
    submitted: "2 hours ago",
  },
  {
    id: "2",
    name: "Tech Expo Ghana",
    organizer: "Innovation Hub GH",
    type: "Ticketing",
    submitted: "4 hours ago",
  },
  {
    id: "3",
    name: "Miss Northern Ghana",
    organizer: "Northern Events",
    type: "Voting",
    submitted: "1 day ago",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">
            Manage events, organizers, and platform operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pending Approvals"
          value="12"
          icon={Clock}
          iconColor="bg-amber-100 text-amber-600"
        />
        <KPICard
          title="Active Events"
          value="89"
          change={5.2}
          icon={Calendar}
          iconColor="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="Today's Transactions"
          value="GHS 45,200"
          change={12.8}
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <KPICard
          title="Active Organizers"
          value="156"
          change={3.1}
          icon={Building2}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Events This Week"
            subtitle="Number of events created per day"
            type="bar"
            data={weeklyEventsData}
            dataKey="events"
            xAxisKey="name"
          />
        </div>
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 h-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Approved Today
                  </span>
                </div>
                <span className="text-lg font-bold text-green-600">8</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Pending Review
                  </span>
                </div>
                <span className="text-lg font-bold text-amber-600">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Flagged Issues
                  </span>
                </div>
                <span className="text-lg font-bold text-red-600">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Pending Approvals
              </h3>
              <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {pendingApprovals.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      {event.type === "Voting" ? (
                        <Vote className="h-5 w-5 text-amber-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{event.name}</p>
                      <p className="text-sm text-slate-500">
                        {event.organizer} • {event.submitted}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      Approve
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ActivityFeed activities={recentActivities} title="Recent Actions" />
      </div>
    </div>
  );
}
