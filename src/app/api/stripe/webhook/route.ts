import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const amountTotal = session.amount_total; // in cents

    if (!userId || !amountTotal) {
      console.error("Missing userId or amount", { userId, amountTotal });
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Credit the full amount the customer paid (in dollars)
    const creditAmount = amountTotal / 100;

    // Credit user balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ balance: profile.balance + creditAmount })
        .eq("id", userId);

      await supabase.from("transactions").insert({
        user_id: userId,
        type: "deposit",
        amount: creditAmount,
        description: `Stripe deposit: $${creditAmount.toFixed(2)}`,
      });

      console.log(`Credited $${creditAmount} to user ${userId}`);
    }
  }

  return NextResponse.json({ received: true });
}
