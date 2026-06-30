import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#050508", color: "white" }}>
      <Navigation />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
