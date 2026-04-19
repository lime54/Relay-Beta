import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Onboarding | Relay",
  description: "Complete your profile to join the community.",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <OnboardingForm />
    </div>
  );
}
