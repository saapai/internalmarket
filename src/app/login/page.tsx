"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/Toast";

type Step = "phone" | "otp" | "name";

/**
 * Normalize any US phone input to E.164 format: +1XXXXXXXXXX
 * Handles: +1 (385) 368-7238, 1-385-368-7238, (385) 368-7238,
 * 3853687238, +13853687238, 1 385 368 7238, etc.
 * Returns null if the number is invalid.
 */
function normalizePhone(raw: string): string | null {
  // Strip everything except digits
  const digits = raw.replace(/[^\d]/g, "");

  // 11 digits starting with 1 → already has US country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // 10 digits → add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Anything else is not a valid US number
  return null;
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const sendOtp = async () => {
    if (!phone) return;
    const formatted = normalizePhone(phone);
    if (!formatted) {
      toast("Enter a valid 10-digit US phone number", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) {
      toast(error.message, "error");
    } else {
      toast("OTP sent to " + formatted, "info");
      setStep("otp");
    }
  };

  const verifyOtp = async () => {
    if (!otp) return;
    const formatted = normalizePhone(phone);
    if (!formatted) return;
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      toast(error.message, "error");
      return;
    }

    if (data.user) {
      // Check if profile has a display name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .single();

      if (!profile?.display_name) {
        setStep("name");
      } else {
        toast("Logged in", "success");
        router.push("/");
        router.refresh();
      }
    }
  };

  const saveName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", user.id);
    }
    setLoading(false);
    toast("Welcome, " + name.trim(), "success");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            SEP <span className="font-mono text-charcoal/40">MARKET</span>
          </h1>
          <p className="text-charcoal/50 text-sm mt-1">
            {step === "phone" && "Enter your phone number"}
            {step === "otp" && "Enter the verification code"}
            {step === "name" && "What should we call you?"}
          </p>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendOtp()}
            />
            <p className="text-xs text-charcoal/40 -mt-2">
              10-digit US number — any format works
            </p>
            <Button
              className="w-full"
              onClick={sendOtp}
              disabled={loading || !phone}
            >
              {loading ? "Sending..." : "Send Code"}
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              className="text-center text-2xl tracking-[0.5em]"
            />
            <Button
              className="w-full"
              onClick={verifyOtp}
              disabled={loading || otp.length < 6}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <button
              onClick={() => setStep("phone")}
              className="w-full text-center text-sm text-charcoal/40 hover:text-charcoal/60"
            >
              Change number
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Your display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
            />
            <Button
              className="w-full"
              onClick={saveName}
              disabled={loading || !name.trim()}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
