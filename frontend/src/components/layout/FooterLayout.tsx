import { Outlet } from 'react-router-dom';
import { LegalFooter } from '../common/LegalFooter';

export function FooterLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}
