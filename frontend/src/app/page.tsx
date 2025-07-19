import Image from "next/image";

export default function HomePage() {
  return (
    <main style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem 1rem' }}>
      {/* Hero Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '1rem', color: '#0070f3' }}>Welcome to TradeLink</h1>
        <p style={{ fontSize: '1.3rem', maxWidth: 700, margin: '0 auto 2rem', color: '#333' }}>
          Empowering Nigerian local producers to reach international buyers. Discover unique products, connect with trusted producers, and grow your business globally—all in one place.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <a href="/dashboard/buyer/products" style={{ padding: '0.85rem 2rem', background: '#0070f3', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}>Browse Products</a>
          <a href="/auth/login" style={{ padding: '0.85rem 2rem', background: '#222', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem' }}>Sign In</a>
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ marginBottom: '2.5rem', maxWidth: 900 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: '#222' }}>How It Works</h2>
        <ol style={{ textAlign: 'left', margin: '0 auto', maxWidth: 600, color: '#444', fontSize: '1.1rem', lineHeight: 1.7 }}>
          <li><strong>Producers</strong> register and list their products with detailed descriptions and images.</li>
          <li><strong>Buyers</strong> browse, search, and discover products from trusted Nigerian producers.</li>
          <li>Buyers can contact producers directly to inquire or negotiate deals.</li>
          <li>TradeLink facilitates secure and transparent connections for global trade.</li>
        </ol>
      </section>

      {/* Why TradeLink Section */}
      <section style={{ maxWidth: 900 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: '#222' }}>Why TradeLink?</h2>
        <ul style={{ textAlign: 'left', margin: '0 auto', maxWidth: 600, color: '#444', fontSize: '1.1rem', lineHeight: 1.7 }}>
          <li>🌍 <strong>Global Reach:</strong> Connect with buyers and sellers worldwide.</li>
          <li>🔒 <strong>Secure Platform:</strong> Safe, transparent, and reliable transactions.</li>
          <li>🤝 <strong>Empowering Local Producers:</strong> Showcase authentic Nigerian products to the world.</li>
          <li>📈 <strong>Grow Your Business:</strong> Access new markets and opportunities.</li>
        </ul>
      </section>
    </main>
  );
}
