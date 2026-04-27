import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Onboarding | Relay",
  description: "Complete your profile to join the community.",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <OnboardingForm user={user} />
    </div>
  );
}
