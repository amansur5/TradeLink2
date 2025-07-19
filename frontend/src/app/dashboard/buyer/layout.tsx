import BuyerNavbar from '@/components/BuyerNavbar';
import '../../globals.css';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <BuyerNavbar />
      <main>
        {children}
      </main>
    </div>
  );
} 