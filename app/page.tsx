import Link from "next/link";
import { FileText, Wifi, WifiOff, History, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME } from "@/constants";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-subtle sticky top-0 z-50 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{APP_NAME}</span>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="glass-panel mx-auto max-w-3xl rounded-2xl p-10">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Write anywhere.
              <span className="block text-primary">Sync everywhere.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Local-first collaborative document editor with offline synchronization,
              deterministic conflict resolution, version history, and AI-powered writing tools.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Start writing free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: WifiOff,
              title: "Offline First",
              desc: "Edit documents with zero network dependency. Changes sync when you're back online.",
            },
            {
              icon: Wifi,
              title: "Real-time Collab",
              desc: "Live cursors, presence, and typing indicators with Socket.io.",
            },
            {
              icon: History,
              title: "Version History",
              desc: "Snapshot, compare, and restore any version without losing history.",
            },
            {
              icon: Sparkles,
              title: "AI Assistant",
              desc: "Summarize, improve, translate, and continue writing with AI.",
            },
          ].map((feature) => (
            <div key={feature.title} className="glass-panel rounded-xl p-6">
              <feature.icon className="mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </section>

        <section className="border-t bg-muted/30 py-12">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 text-center">
            <Shield className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Role-based access control • JWT authentication • Payload validation • Rate limiting
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
