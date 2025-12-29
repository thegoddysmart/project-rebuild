"use client";

import { useState } from "react";
import { requestPayout } from "@/app/actions/payouts";

export default function PayoutRequestForm({
  availableBalance,
}: {
  availableBalance: number;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(e.target as HTMLFormElement);
    const result = await requestPayout({
      amount: Number(formData.get("amount")),
      method: formData.get("method") as string,
      bankName: formData.get("bankName") as string,
      number: formData.get("number") as string,
      name: formData.get("name") as string,
    });

    setLoading(false);
    if (result.success) {
      setMessage("Payout requested successfully!");
      setAmount(0);
    } else {
      setMessage(`Error: ${result.error}`);
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md">
      <h2 className="text-xl font-bold mb-4">Request Payout</h2>
      <div className="mb-4">
        <span className="text-gray-600">Available Balance:</span>
        <span className="text-2xl font-bold text-green-600 block">
          GHS {availableBalance.toFixed(2)}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Amount (GHS)</label>
          <input
            name="amount"
            type="number"
            max={availableBalance}
            min={1}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Payment Method</label>
          <select name="method" className="w-full border rounded p-2">
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Account Name</label>
          <input
            name="name"
            type="text"
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Bank/Network</label>
            <input
              name="bankName"
              type="text"
              placeholder="e.g. MTN / Ecobank"
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Number/IBAN</label>
            <input
              name="number"
              type="text"
              className="w-full border rounded p-2"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || amount > availableBalance || amount <= 0}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50 hover:bg-blue-700"
        >
          {loading ? "Processing..." : "Request Payout"}
        </button>

        {message && (
          <div
            className={`p-3 rounded ${
              message.includes("Error")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
