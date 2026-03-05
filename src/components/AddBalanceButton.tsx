"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/fZu14ggEnfw05aq3Kid7q00";

export default function AddBalanceButton() {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  if (!userId) return null;

  // Pass user ID via client_reference_id so the webhook knows who paid
  const checkoutUrl = `${STRIPE_PAYMENT_LINK}?client_reference_id=${userId}`;

  return (
    <a
      href={checkoutUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="px-3 py-1.5 rounded-lg bg-yes text-white text-xs font-bold hover:bg-yes/90 transition-colors"
    >
      + Add $
    </a>
  );
}
