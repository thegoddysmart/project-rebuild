"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NominationFieldType } from "@prisma/client";

export async function getEventNominationForm(eventId: string) {
  // Retrieve session but do not enforce auth for getting the form as it is public
  // const session = await getServerSession(authOptions);
  // if (!session || !session.user) throw new Error("Unauthorized");

  const form = await prisma.eventNominationForm.findUnique({
    where: { eventId },
    include: {
      fields: {
        orderBy: { order: "asc" },
      },
    },
  });

  return form;
}

export async function upsertNominationForm(
  eventId: string,
  isActive: boolean,
  whatsappLink?: string
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const form = await prisma.eventNominationForm.upsert({
    where: { eventId },
    create: {
      eventId,
      isActive,
      whatsappLink,
    },
    update: {
      isActive,
      whatsappLink,
    },
  });

  revalidatePath(`/organizer/events/${eventId}/nominations/settings`);
  return form;
}

export async function upsertNominationField(data: {
  id?: string;
  formId: string;
  key: string;
  label: string;
  type: NominationFieldType;
  required: boolean;
  options?: any;
  order: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  if (data.id) {
    await prisma.nominationField.update({
      where: { id: data.id },
      data: {
        label: data.label,
        type: data.type,
        required: data.required,
        options: data.options,
        order: data.order,
      },
    });
  } else {
    // Check if key exists
    const existing = await prisma.nominationField.findFirst({
      where: { formId: data.formId, key: data.key },
    });

    if (existing) throw new Error("Field key must be unique.");

    await prisma.nominationField.create({
      data: {
        formId: data.formId,
        key: data.key,
        label: data.label,
        type: data.type,
        required: data.required,
        options: data.options,
        order: data.order,
      },
    });
  }

  // Find eventId to revalidate
  const form = await prisma.eventNominationForm.findUnique({
    where: { id: data.formId },
    select: { eventId: true },
  });

  if (form) {
    revalidatePath(`/organizer/events/${form.eventId}/nominations/settings`);
  }
}

export async function deleteNominationField(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");

  const field = await prisma.nominationField.delete({
    where: { id },
    include: { form: true },
  });

  revalidatePath(
    `/organizer/events/${field.form.eventId}/nominations/settings`
  );
}
