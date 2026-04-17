"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { redirectLocalized } from "@/lib/action-helpers";
import { parseMoney } from "@/lib/money";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z
    .string()
    .trim()
    .max(32)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  sessionPrice: z.number().int().min(0),
  defaultTeacherRate: z.number().int().min(0).nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  active: z.boolean().optional(),
});

export type FormState = { error: string | null };

function extract(formData: FormData) {
  const sessionPrice = parseMoney(String(formData.get("sessionPrice") ?? "0")) ?? 0;
  const teacherRateStr = String(formData.get("defaultTeacherRate") ?? "").trim();
  const teacherRate = teacherRateStr === "" ? null : parseMoney(teacherRateStr);
  return {
    name: String(formData.get("name") ?? ""),
    code: (formData.get("code") as string) || null,
    sessionPrice,
    defaultTeacherRate: teacherRate,
    color: (formData.get("color") as string) || null,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  };
}

export async function createSubject(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  try {
    const created = await prisma.subject.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        sessionPrice: parsed.data.sessionPrice,
        defaultTeacherRate: parsed.data.defaultTeacherRate,
        color: parsed.data.color,
        active: parsed.data.active ?? true,
      },
    });
    await recordAudit({
      actorId: session.user.id,
      action: "subject.create",
      entity: "Subject",
      entityId: created.id,
      payload: { after: created },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "duplicate" };
    }
    throw e;
  }
  revalidatePath("/subjects");
  return redirectLocalized("/subjects");
}

export async function updateSubject(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const before = await prisma.subject.findUnique({ where: { id } });
  if (!before) return { error: "notfound" };
  try {
    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        sessionPrice: parsed.data.sessionPrice,
        defaultTeacherRate: parsed.data.defaultTeacherRate,
        color: parsed.data.color,
        active: parsed.data.active ?? before.active,
      },
    });
    await recordAudit({
      actorId: session.user.id,
      action: "subject.update",
      entity: "Subject",
      entityId: id,
      payload: { before, after: updated },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "duplicate" };
    }
    throw e;
  }
  revalidatePath("/subjects");
  revalidatePath(`/subjects/${id}`);
  return redirectLocalized(`/subjects/${id}`);
}

export async function deleteSubject(id: string): Promise<void> {
  const session = await requireSession();
  const before = await prisma.subject.findUnique({ where: { id } });
  if (!before) return;
  await prisma.subject.update({ where: { id }, data: { active: false } });
  await recordAudit({
    actorId: session.user.id,
    action: "subject.deactivate",
    entity: "Subject",
    entityId: id,
    payload: { before },
  });
  revalidatePath("/subjects");
  return redirectLocalized("/subjects");
}
