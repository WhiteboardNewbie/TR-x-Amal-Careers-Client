import { SignInBranding } from "@/components/SignInBranding";
import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh bg-amal-white text-amal-ink">
      <SignInBranding />
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <SignInForm />
      </div>
    </div>
  );
}
