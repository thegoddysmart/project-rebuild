"use client";

import { useState } from "react";
import { BarChart2, Calendar, Save, Clock, Globe, Info } from "lucide-react";
import {
  updateEventTimelines,
  publishEvent,
  updateEventVisibility,
} from "@/app/actions/event";
import { clsx } from "clsx";

type EventLifecycleProps = {
  eventId: string;
  status: string;

  type: "VOTING" | "TICKETING" | "HYBRID";
  nominationStartsAt: string | null;
  nominationEndsAt: string | null;
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  showLiveResults: boolean;
  showVoteCount: boolean;
  onUpdate: () => void;
};

// ... existing helper ...
const toInputString = (dateStr: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // Adjust to local
  return d.toISOString().slice(0, 16);
};

export default function EventLifecycleControls({
  eventId,
  status,
  type,
  nominationStartsAt,
  nominationEndsAt,
  votingStartsAt,
  votingEndsAt,
  showLiveResults,
  showVoteCount,
  onUpdate,
}: EventLifecycleProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dates, setDates] = useState({
    nomStart: toInputString(nominationStartsAt),
    nomEnd: toInputString(nominationEndsAt),
    voteStart: toInputString(votingStartsAt),
    voteEnd: toInputString(votingEndsAt),
  });

  const handleChange = (field: keyof typeof dates, value: string) => {
    setDates((prev) => ({ ...prev, [field]: value }));
  };

  const saveTimelines = async () => {
    setLoading("saving");
    try {
      // Client-side validation
      if (dates.nomStart && dates.nomEnd && dates.nomStart >= dates.nomEnd) {
        alert("Nomination End Date must be after Start Date");
        setLoading(null);
        return;
      }
      if (
        dates.voteStart &&
        dates.voteEnd &&
        dates.voteStart >= dates.voteEnd
      ) {
        alert("Voting End Date must be after Start Date");
        setLoading(null);
        return;
      }
      // Overlap check disabled to allow flexibility if needed, relying on server or user discretion
      // if (dates.nomEnd && dates.voteStart && dates.voteStart < dates.nomEnd) { ... }

      const payload = {
        nominationStartsAt: dates.nomStart ? new Date(dates.nomStart) : null,
        nominationEndsAt: dates.nomEnd ? new Date(dates.nomEnd) : null,
        votingStartsAt: dates.voteStart ? new Date(dates.voteStart) : null,
        votingEndsAt: dates.voteEnd ? new Date(dates.voteEnd) : null,
      };

      const result = await updateEventTimelines(eventId, payload);
      if (result.success) {
        onUpdate();
        alert("Timelines updated successfully!");
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save timelines");
    } finally {
      setLoading(null);
    }
  };

  const toggleVisibility = async (key: "showLiveResults" | "showVoteCount") => {
    setLoading(key);
    try {
      const newValue =
        key === "showLiveResults" ? !showLiveResults : !showVoteCount;
      const result = await updateEventVisibility(eventId, {
        [key]: newValue,
      });

      if (result.success) {
        onUpdate();
      } else {
        alert(result.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update visibility");
    } finally {
      setLoading(null);
    }
  };

  const handlePublish = async () => {
    setLoading("publish");
    try {
      const result = await publishEvent(eventId);
      if (result.success) {
        onUpdate();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Publish failed");
    } finally {
      setLoading(null);
    }
  };

  const isPublished = status === "PUBLISHED" || status === "LIVE";
  const isApproved = status === "APPROVED";
  const showVotingControls = type === "VOTING" || type === "HYBRID";

  // Phase Status Evaluator
  const getPhaseStatus = (start: string, end: string) => {
    if (!start || !end)
      return { label: "NOT SET", color: "bg-slate-100 text-slate-500" };
    const now = new Date().toISOString().slice(0, 16); // Simple string comp enough for UI state
    if (now < start)
      return { label: "SCHEDULED", color: "bg-amber-100 text-amber-700" };
    if (now >= start && now < end)
      return { label: "ACTIVE", color: "bg-green-100 text-green-700" };
    return { label: "ENDED", color: "bg-slate-200 text-slate-600" };
  };

  const nomStatus = getPhaseStatus(dates.nomStart, dates.nomEnd);
  const voteStatus = getPhaseStatus(dates.voteStart, dates.voteEnd);

  if (!isApproved && !isPublished) return null;

  return (
    <div className="space-y-4">
      {/* PUBLISH ACTION */}
      {!isPublished && (
        <button
          disabled={loading !== null}
          onClick={handlePublish}
          className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left border border-green-200 cursor-pointer"
        >
          <Globe className="h-5 w-5 text-green-600" />
          <div>
            <span className="font-medium text-green-700 block">
              Publish Event
            </span>
            <span className="text-xs text-green-600">
              Make event visible to public
            </span>
          </div>
        </button>
      )}

      {(isApproved || isPublished) && showVotingControls && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" /> Phase Management
              </h3>
              <button
                onClick={saveTimelines}
                disabled={loading !== null}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Save size={16} />{" "}
                {loading === "saving" ? "Saving..." : "Save Timelines"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nomination Phase */}
              <div
                className={clsx(
                  "p-4 rounded-lg border",
                  nomStatus.label === "ACTIVE"
                    ? "border-green-200 bg-green-50/30"
                    : "border-slate-200 bg-slate-50/50"
                )}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-slate-700 text-sm uppercase">
                    Nomination Phase
                  </span>
                  <span
                    className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded",
                      nomStatus.color
                    )}
                  >
                    {nomStatus.label}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={dates.nomStart}
                      onChange={(e) => handleChange("nomStart", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={dates.nomEnd}
                      onChange={(e) => handleChange("nomEnd", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Voting Phase */}
              <div
                className={clsx(
                  "p-4 rounded-lg border",
                  voteStatus.label === "ACTIVE"
                    ? "border-green-200 bg-green-50/30"
                    : "border-slate-200 bg-slate-50/50"
                )}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-slate-700 text-sm uppercase">
                    Voting Phase
                  </span>
                  <span
                    className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded",
                      voteStatus.color
                    )}
                  >
                    {voteStatus.label}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={dates.voteStart}
                      onChange={(e) =>
                        handleChange("voteStart", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={dates.voteEnd}
                      onChange={(e) => handleChange("voteEnd", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <p>
                Set the windows for nominations and voting. The system will
                automatically switch phases based on the current time.
              </p>
            </div>
          </div>

          {/* VISIBILITY CONTROLS */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-slate-500" /> Results &
                Visibility
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Live Results Toggle */}
              <div
                className={clsx(
                  "p-4 rounded-lg border border-slate-200 flex items-center justify-between transition-colors",
                  showLiveResults ? "bg-slate-50" : "bg-white"
                )}
              >
                <div>
                  <p className="font-medium text-slate-900">Live Results Tab</p>
                  <p className="text-sm text-slate-500">
                    Show "Results" tab on public page
                  </p>
                </div>
                <button
                  onClick={() => toggleVisibility("showLiveResults")}
                  disabled={loading !== null}
                  className={clsx(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    showLiveResults ? "bg-green-600" : "bg-slate-200"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      showLiveResults ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Vote Counts Toggle */}
              <div
                className={clsx(
                  "p-4 rounded-lg border border-slate-200 flex items-center justify-between transition-colors",
                  showVoteCount ? "bg-slate-50" : "bg-white"
                )}
              >
                <div>
                  <p className="font-medium text-slate-900">Vote Counts</p>
                  <p className="text-sm text-slate-500">
                    Show numeric vote counts publicly
                  </p>
                </div>
                <button
                  onClick={() => toggleVisibility("showVoteCount")}
                  disabled={loading !== null}
                  className={clsx(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    showVoteCount ? "bg-green-600" : "bg-slate-200"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      showVoteCount ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Info className="w-4 h-4 text-slate-400 mt-0.5" />
              <p>
                <strong>Tip:</strong> You can enable "Live Results Tab" but
                disable "Vote Counts" to show only relative rankings without
                revealing exact numbers. Turn both ON to show full results.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
