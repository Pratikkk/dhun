import { Github, Twitter } from "lucide-react";
import { DhunLogo } from "@/components/site/logo";
import {
  EXTERNAL_LINK_PROPS,
  GITHUB_REPO,
} from "@/components/site/constants";

const PROJECT_LINKS = [
  { label: "Commands", href: "#commands" },
  { label: "Install", href: "#install" },
  { label: "FAQ", href: "#faq" },
  { label: "Changelog", href: `${GITHUB_REPO}/releases` },
];

const COMMUNITY_LINKS = [
  { label: "GitHub", href: GITHUB_REPO },
  { label: "Issues", href: `${GITHUB_REPO}/issues` },
  { label: "Discussions", href: `${GITHUB_REPO}/discussions` },
  { label: "Releases", href: `${GITHUB_REPO}/releases` },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-[#100e12]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <DhunLogo className="size-7" />
              <span className="font-mono text-lg font-semibold tracking-tight">
                dhun
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Music, minus the browser. Download songs from JioSaavn straight
              from your terminal.
            </p>
            <div className="mt-4 flex items-center gap-1">
              <a
                href={GITHUB_REPO}
                {...EXTERNAL_LINK_PROPS}
                aria-label="dhun on GitHub"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <Github className="size-4" />
              </a>
              <a
                href="#"
                aria-label="dhun on Twitter / X"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <Twitter className="size-4" />
              </a>
            </div>
          </div>

          <nav aria-label="Project links">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground/70">
              Project
            </p>
            <ul className="space-y-2.5">
              {PROJECT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Community links">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground/70">
              Community
            </p>
            <ul className="space-y-2.5">
              {COMMUNITY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground/70">
              Legal
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Disclaimer
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_REPO}/blob/main/LICENSE`}
                  {...EXTERNAL_LINK_PROPS}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  MIT License
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground/80">
            dhun is an independent, MIT-licensed community project and is not
            affiliated with, endorsed by, or connected to JioSaavn or Jio
            Platforms Ltd. All music and artwork belong to their respective
            owners. Please use responsibly and support the artists you love.
          </p>
          <p className="mt-3 font-mono text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} dhun contributors · built with
            Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
