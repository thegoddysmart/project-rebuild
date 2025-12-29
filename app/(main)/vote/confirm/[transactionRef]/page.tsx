import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";

export default async function VoteConfirmationPage({
  params,
}: {
  params: Promise<{ transactionRef: string }>;
}) {
  const { transactionRef } = await params;

  // Validate Transaction
  const transaction = await prisma.transaction.findUnique({
    where: { reference: transactionRef },
  });

  if (!transaction) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <XCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Invalid Transaction</h1>
        <p className="text-gray-600 mb-8">
          The reference ID provided does not exist.
        </p>
        <Link
          href="/events/voting"
          className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition"
        >
          Return to Events
        </Link>
      </div>
    );
  }

  // Cast metadata safely
  const meta: any = transaction.metadata || {};

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={40} />
      </div>
      <h1 className="text-3xl font-bold mb-2">Vote Successful!</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        Your vote for <span className="font-bold">{meta.candidateName}</span>{" "}
        has been recorded.
      </p>

      <div className="bg-gray-50 rounded-xl p-4 mb-8 w-full max-w-xs text-sm">
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">Amount Paid</span>
          <span className="font-bold">GHS {transaction.amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">Votes</span>
          <span className="font-bold">{meta.quantity || 1}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Reference</span>
          <span className="font-mono">{transaction.reference}</span>
        </div>
      </div>

      <Link
        href="/events/voting"
        className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition"
      >
        Continue Voting
      </Link>
    </div>
  );
}
