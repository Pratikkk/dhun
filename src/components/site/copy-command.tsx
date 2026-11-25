"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyCommandProps {
  command: string;
  label?: string;
  className?: string;
}

/** A terminal-style command line with a copy-to-clipboard button. */
export function CopyCommand({ command, label, className }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success(label ?? "Command copied to clipboard", {
        description: command,
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy automatically", {
        description: "Select the command and copy it manually.",
      });
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm shadow-xs transition-colors focus-within:border-ring",
        className
      )}
    >
      <span aria-hidden="true" className="select-none text-primary">
        $
      </span>
      <code className="min-w-0 flex-1 truncate text-foreground/90">
        {command}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={copy}
        aria-label={`Copy command: ${command}`}
        className="h-7 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-400" />
        ) : (
          <Copy className="size-3.5" />
        )}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}
