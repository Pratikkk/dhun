import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { Features } from "@/components/site/features";
import { Demo } from "@/components/site/demo";
import { Install } from "@/components/site/install";
import { Commands } from "@/components/site/commands";
import { Faq } from "@/components/site/faq";
import { Cta } from "@/components/site/cta";
import { Footer } from "@/components/site/footer";
import { AppShell } from "@/components/site/app-shell";

export default function Home() {
  return (
    <AppShell>
      <div className="relative flex min-h-screen flex-col overflow-x-clip">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <Features />
          <Demo />
          <Install />
          <Commands />
          <Faq />
          <Cta />
        </main>
        <Footer />
      </div>
    </AppShell>
  );
}
