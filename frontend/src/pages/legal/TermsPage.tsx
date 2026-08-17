import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TermsPage() {
  const navigate = useNavigate();
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL;

  return (
    <div className="min-h-screen w-full bg-[#080A0F] p-6 text-gray-200 md:p-12 font-sans">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-800 bg-[#12141A] text-gray-400 hover:text-white hover:border-gray-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-white">Terms of Use</h1>
        </div>

        <div className="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base bg-[#12141A] p-6 md:p-10 rounded-2xl border border-gray-800/80">
          <p className="text-gray-400">Effective Date: August 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p>By creating an account or accessing NexusSpace, you agree to comply with and be bound by these Terms of Use. If you do not agree, you must not access or use the application.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Account Responsibility</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. You agree to notify us immediately of any unauthorized access.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Acceptable Use</h2>
            <p>You agree to use the service solely for lawful educational purposes. Prohibited activities include attempting to bypass security boundaries, reverse-engineering software endpoints, launching denial-of-service attacks, injecting malicious payloads into AI prompts, or extracting system data through unauthorized automation.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. AI-Generated Educational Content</h2>
            <p>NexusSpace integrates automated AI inference to assist in curriculum structuring, study aids, and quiz generation. AI outputs are provided "as is" for informational and study assistance. We make no representations regarding the absolute factual accuracy or completeness of AI-generated content.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Intellectual Property</h2>
            <p>The NexusSpace interface, source code, design systems, and software workflows are protected by copyright and applicable intellectual property laws. Content and workspaces you create remain associated with your user account.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms or present security risks to the application. You may terminate your account at any time by utilizing the Delete Account feature in your Profile settings.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Disclaimer & Limitation of Liability</h2>
            <p>NexusSpace is provided on an "as is" and "as available" basis without warranties of any kind, express or implied. To the maximum extent permitted by law, NexusSpace shall not be liable for any indirect, incidental, or consequential damages arising from the use of or inability to use the service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Contact Information</h2>
            <p>
              For questions regarding these Terms, please contact:{" "}
              {supportEmail ? (
                <a href={"mailto:" + supportEmail} className="text-[#BCFF3C] hover:underline font-mono">
                  {supportEmail}
                </a>
              ) : (
                <span className="text-gray-400">the administrator email address configured in the application environment.</span>
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
