"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { redirectLocalized } from "@/lib/action-helpers";

const studentSchema = z.object({
  code: z.string().trim().min(1).max(64),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  guardianName: z.string().trim().max(120).optional().nullable(),
  guardianPhone: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  active: z.boolean().optional(),
});

function extract(formData: FormData) {
  return {
    code: String(formData.get("code") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: (formData.get("phone") as string) || null,
    guardianName: (formData.get("guardianName") as string) || null,
    guardianPhone: (formData.get("guardianPhone") as string) || null,
    notes: (formData.get("notes") as string) || null,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  };
}

export type FormState = { error: string | null; fieldErrors?: Record<string, string> };

export async function createStudent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = studentSchema.safeParse(extract(formData));
  if (!parsed.success) {
    return { error: "validation" };
  }
  try {
    const created = await prisma.student.create({
      data: {
        code: parsed.data.code,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        guardianName: parsed.data.guardianName,
        guardianPhone: parsed.data.guardianPhone,
        notes: parsed.data.notes,
        active: parsed.data.active ?? true,
      },
    });
    await recordAudit({
      actorId: session.user.id,
      action: "student.create",
      entity: "Student",
      entityId: created.id,
      payload: { after: created },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "duplicate" };
    }
    throw e;
  }
  revalidatePath("/students");
  return redirectLocalized("/students");
}

export async function updateStudent(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = studentSchema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  try {
    const before = await prisma.student.findUnique({ where: { id } });
    if (!before) return { error: "notfound" };
    const updated = await prisma.student.update({
      where: { id },
      data: {
        code: parsed.data.code,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        guardianName: parsed.data.guardianName,
        guardianPhone: parsed.data.guardianPhone,
        notes: parsed.data.notes,
        active: parsed.data.active ?? before.active,
      },
    });
    await recordAudit({
      actorId: session.user.id,
      action: "student.update",
      entity: "Student",
      entityId: id,
      payload: { before, after: updated },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "duplicate" };
    }
    throw e;
  }
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return redirectLocalized(`/students/${id}`);
}

export async function deleteStudent(id: string): Promise<void> {
  const session = await requireSession();
  const before = await prisma.student.findUnique({ where: { id } });
  if (!before) return;
  // Soft-delete semantics: deactivate rather than hard-delete to preserve
  // ledger / audit references. Phase 1 has no ledger entries yet, but we
  // keep the same semantics for consistency.
  await prisma.student.update({ where: { id }, data: { active: false } });
  await recordAudit({
    actorId: session.user.id,
    action: "student.deactivate",
    entity: "Student",
    entityId: id,
    payload: { before },
  });
  revalidatePath("/students");
  return redirectLocalized("/students");
}
