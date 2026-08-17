import { Link } from 'react-router-dom';

export function LegalFooter() {
  return (
    <footer className="w-full border-t border-gray-800/60 bg-[#080A0F] py-6 text-center text-xs text-gray-500 mt-auto">
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <Link to="/support" className="hover:text-white transition-colors">Contact Support</Link>
      </div>
      <p className="mt-3 opacity-50">© {new Date().getFullYear()} NexusSpace. All rights reserved.</p>
    </footer>
  );
}
