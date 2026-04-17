"use client";

import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-print")}
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
