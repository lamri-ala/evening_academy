"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSubject } from "../actions";

export function DeleteSubjectButton({
  id,
  labels,
}: {
  id: string;
  labels: { delete: string; confirm: string };
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(labels.confirm)) return;
        startTransition(async () => {
          await deleteSubject(id);
        });
      }}
    >
      <Trash2 className="h-4 w-4" />
      {labels.delete}
    </Button>
  );
}
