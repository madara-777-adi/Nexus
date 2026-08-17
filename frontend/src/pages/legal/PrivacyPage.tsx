import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PrivacyPage() {
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
        </div>

        <div className="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base bg-[#12141A] p-6 md:p-10 rounded-2xl border border-gray-800/80">
          <p className="text-gray-400">Effective Date: August 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
            <p>We collect information directly provided when registering an account: first name, last name, and email address. For local password accounts, passwords are cryptographically hashed using bcrypt (12 rounds) along with a limited history of previous hashes to prevent reuse. Passwords and hashes are never exposed in API responses.</p>
            <p>For accounts created or authenticated via Google or GitHub OAuth, we ingest your verified email address, name, and profile avatar URL. No third-party OAuth access or refresh tokens are retained in our database after the authentication handshake completes.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Learning & Workspace Data</h2>
            <p>We store curriculum data created within your account, including workspaces, concepts, structural relationships, resources, learning progress, lessons, flashcards, and quizzes. Quiz answers are processed dynamically by our evaluator service to calculate mastery scores and feedback, and are not permanently persisted as raw answer logs.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Authentication & Session Cookies</h2>
            <p>We utilize an HttpOnly, Secure, SameSite refresh cookie solely for session persistence. Short-lived access tokens are held exclusively in memory by the client. Active sessions are tracked via token versioning; changing your password immediately invalidates all active access and refresh sessions.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Third-Party AI Inference</h2>
            <p>To dynamically generate study blueprints, lessons, flashcards, and quiz evaluations, workspace and concept titles and learning prompts are transmitted to external AI inference providers (Groq and Cerebras). We do not send your name, email address, user IDs, or account credentials to external AI inference providers.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Infrastructure & Service Providers</h2>
            <p>All primary account and learning records are stored in MongoDB. Transactional emails (such as email verification and password reset links) are delivered via Resend. We do not engage in marketing emails, analytics tracking, or data brokering.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Data Deletion & Retention</h2>
            <p>You can permanently delete your account and all associated data at any time from your Account Settings. Deleting your account performs an atomic cascade deletion across all user records, workspaces, concepts, lessons, flashcards, quizzes, and security tokens in MongoDB.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Contact</h2>
            <p>
              For privacy-related inquiries, please contact us at:{" "}
              {supportEmail ? (
                <a href={"mailto:" + supportEmail} className="text-[#BCFF3C] hover:underline font-mono">
                  {supportEmail}
                </a>
              ) : (
                <span className="text-gray-400">the configured administrator email address.</span>
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
