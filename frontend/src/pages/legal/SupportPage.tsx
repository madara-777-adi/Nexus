import { ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SupportPage() {
  const navigate = useNavigate();
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL;

  return (
    <div className="min-h-screen w-full bg-[#080A0F] p-6 text-gray-200 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md space-y-6 bg-[#12141A] p-8 rounded-2xl border border-gray-800/80 shadow-2xl text-center">
        <div className="flex justify-center mb-2">
          <div className="h-16 w-16 bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] rounded-2xl flex items-center justify-center">
            <Mail className="h-8 w-8" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-white">Contact Support</h1>
        
        <p className="text-gray-400 text-sm leading-relaxed">
          Need help with your account or encountered a technical issue? We are here to help.
        </p>

        {supportEmail ? (
          <div className="p-4 bg-[#181B22] rounded-xl border border-gray-800">
            <a href={"mailto:" + supportEmail} className="text-base sm:text-lg font-mono font-medium text-[#BCFF3C] hover:underline break-all">
              {supportEmail}
            </a>
          </div>
        ) : (
          <div className="p-4 bg-[#181B22] rounded-xl border border-gray-800 text-xs text-gray-400">
            Support contact is not currently configured.
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-all hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    </div>
  );
}
