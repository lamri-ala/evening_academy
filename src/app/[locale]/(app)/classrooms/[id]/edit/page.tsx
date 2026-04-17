import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { ClassroomForm } from "../../classroom-form";
import { updateClassroom, deleteClassroom } from "../../actions";
import { DeleteClassroomButton } from "./delete-button";

export default async function EditClassroomPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom) notFound();

  // Bind deleteClassroom to this id for the form-less button. Avoids unused imports.
  void deleteClassroom;

  const action = updateClassroom.bind(null, id);

  return (
    <>
      <PageHeader
        title={`${tCommon("edit")} — ${classroom.name}`}
        actions={
          <DeleteClassroomButton
            id={id}
            labels={{
              delete: tCommon("delete"),
              confirm: tCommon("confirmDelete"),
            }}
          />
        }
      />
      <ClassroomForm
        action={action}
        initial={{
          id: classroom.id,
          name: classroom.name,
          capacity: classroom.capacity,
          notes: classroom.notes,
          active: classroom.active,
        }}
      />
    </>
  );
}
