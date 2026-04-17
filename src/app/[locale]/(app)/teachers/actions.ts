"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { redirectLocalized } from "@/lib/action-helpers";
import { parseMoney } from "@/lib/money";

const baseSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  notes: z.string().trim().max(2000).optional().nullable(),
  sessionRate: z.number().int().min(0),
  active: z.boolean().optional(),
});

export type FormState = { error: string | null };

function extract(formData: FormData) {
  const rateStr = String(formData.get("sessionRate") ?? "0");
  const rateMinor = parseMoney(rateStr) ?? 0;
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    notes: (formData.get("notes") as string) || null,
    sessionRate: rateMinor,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  };
}

export async function createTeacher(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = baseSchema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const created = await prisma.teacher.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
      sessionRate: parsed.data.sessionRate,
      active: parsed.data.active ?? true,
    },
  });
  await recordAudit({
    actorId: session.user.id,
    action: "teacher.create",
    entity: "Teacher",
    entityId: created.id,
    payload: { after: created },
  });
  revalidatePath("/teachers");
  return redirectLocalized("/teachers");
}

export async function updateTeacher(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = baseSchema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const before = await prisma.teacher.findUnique({ where: { id } });
  if (!before) return { error: "notfound" };
  const updated = await prisma.teacher.update({
    where: { id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
      sessionRate: parsed.data.sessionRate,
      active: parsed.data.active ?? before.active,
    },
  });
  await recordAudit({
    actorId: session.user.id,
    action: "teacher.update",
    entity: "Teacher",
    entityId: id,
    payload: { before, after: updated },
  });
  revalidatePath("/teachers");
  revalidatePath(`/teachers/${id}`);
  return redirectLocalized(`/teachers/${id}`);
}

export async function deleteTeacher(id: string): Promise<void> {
  const session = await requireSession();
  const before = await prisma.teacher.findUnique({ where: { id } });
  if (!before) return;
  await prisma.teacher.update({ where: { id }, data: { active: false } });
  await recordAudit({
    actorId: session.user.id,
    action: "teacher.deactivate",
    entity: "Teacher",
    entityId: id,
    payload: { before },
  });
  revalidatePath("/teachers");
  return redirectLocalized("/teachers");
}
