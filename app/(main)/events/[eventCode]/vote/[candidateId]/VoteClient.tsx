"use client";

import { useState } from "react";
import { Event, Candidate } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Check, Copy } from "lucide-react";

interface VoteClientProps {
  event: Event;
  candidate: Candidate;
}

export default function VoteClient({ event, candidate }: VoteClientProps) {
  const router = useRouter();
  const [voteCount, setVoteCount] = useState(1);
  // State for checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutRef, setCheckoutRef] = useState("");

  // Form States
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const minimalVotePrice = event.votePrice || 1.0;
  const totalAmount = (voteCount * minimalVotePrice).toFixed(2);

  const handlePayment = async () => {
    // Call the real API
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          candidateId: candidate.id,
          quantity: voteCount,
          voterName: fullName,
          voterPhone: phoneNumber,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to process vote");
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Intercept Simulated Flows
        if (
          data.transactionRef &&
          data.transactionRef.startsWith("VOTE-") &&
          data.paymentUrl &&
          data.paymentUrl.includes("appsn")
        ) {
          // It is an Appsn transaction.
          // We can strip the ref from URL or just use transactionRef from API if it matches "reference" param.
          // API returns transactionRef. Use that.
          setCheckoutRef(data.transactionRef);
          setShowCheckout(true);
          return;
        }

        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else if (data.transactionRef) {
          router.push(`/vote/confirm/${data.transactionRef}`);
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An unexpected error occurred.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Vote for ${candidate.name}`,
      text: `Support ${candidate.name} in ${event.title}!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row">
          {/* LEFT COLUMN: Image */}
          <div className="md:w-1/2 h-96 md:h-auto relative bg-gray-100">
            <img
              src={candidate.image}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* RIGHT COLUMN: Form */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
            <Link
              href={`/events/${event.eventCode}`}
              className="absolute top-6 left-8 md:left-12 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft size={18} /> Back
            </Link>

            <button
              onClick={handleShare}
              className="absolute top-6 right-8 md:right-12 flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 px-3 py-1.5 rounded-full"
            >
              {isCopied ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Share2 size={16} /> Share
                </>
              )}
            </button>

            <div className="text-center md:text-left mb-8 mt-6">
              <h1 className="text-2xl font-bold text-primary-900 mb-2">
                Vote for {candidate.name}{" "}
                <span className="text-primary-700">({candidate.code})</span>
              </h1>
              <p className="text-gray-500 text-sm mb-4">
                Support {candidate.name} by submitting your vote. You can also
                vote via USSD by dialing{" "}
                <span className="font-bold text-gray-700">*929*39#</span>
              </p>
            </div>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 bg-gray-50/50"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="024 XXX XXXX"
                  className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 bg-gray-50/50"
                />
              </div>

              {/* Votes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Number of Votes (GHS {minimalVotePrice.toFixed(2)})
                </label>
                <input
                  type="number"
                  min="1"
                  value={voteCount}
                  onChange={(e) => setVoteCount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 bg-gray-50/50"
                />
              </div>

              {/* Total Price Display */}
              <div className="text-sm text-gray-500 pt-2">
                Total Price:{" "}
                <span className="font-bold text-gray-900">
                  GHS {totalAmount}
                </span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePayment}
                disabled={voteCount < 1}
                className="w-full bg-primary-900 text-white font-bold py-4 rounded-full shadow-lg hover:bg-primary-800 transition-transform active:scale-[0.99] mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Pay GHS {totalAmount} & Vote
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCheckout && (
        <AppsnCheckoutModal
          reference={checkoutRef}
          onClose={() => setShowCheckout(false)}
          onSuccess={(ref) => router.push(`/vote/confirm/${ref}`)}
        />
      )}
    </>
  );
}

import { AppsnCheckoutModal } from "@/app/components/payment/AppsnCheckoutModal";
