import { getGlobalTransactions } from "@/app/actions/super-admin";
import TransactionsTable from "./TransactionsTable";
import { ArrowRightLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GlobalTransactionsPage() {
  const transactions = await getGlobalTransactions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Global Transactions
        </h1>
        <p className="text-slate-500">
          A centralized ledger of all payments across all events.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            Recent Activity (Last 100)
          </h3>
        </div>
        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}
