"use client";

import type { Payout } from "@prisma/client";
import { format } from "date-fns";

export default function PayoutHistoryTable({ payouts }: { payouts: Payout[] }) {
  if (payouts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">
        <p>No payout history found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-medium">
          <tr>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Reference</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Method</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payouts.map((payout) => (
            <tr
              key={payout.id}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <td className="px-6 py-4">
                {format(new Date(payout.createdAt), "MMM d, yyyy h:mm a")}
              </td>
              <td className="px-6 py-4 font-mono text-xs text-gray-500">
                {payout.id.slice(-8).toUpperCase()}
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">
                {payout.currency} {Number(payout.amount).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-gray-600">
                {/* @ts-ignore: method might be missing in older client types */}
                {payout.method || "BANK"}
                <div className="text-xs text-gray-400">
                  {payout.bankName} - {payout.bankAccountNumber}
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium inline-block
                    ${
                      payout.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : ""
                    }
                    ${
                      payout.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : ""
                    }
                    ${
                      payout.status === "PROCESSING"
                        ? "bg-blue-100 text-blue-700"
                        : ""
                    }
                    ${
                      payout.status === "FAILED"
                        ? "bg-red-100 text-red-700"
                        : ""
                    }
                    ${
                      payout.status === "CANCELLED"
                        ? "bg-gray-100 text-gray-700"
                        : ""
                    }
                  `}
                >
                  {payout.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
