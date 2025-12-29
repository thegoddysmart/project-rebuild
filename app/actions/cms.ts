"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { faqData } from "@/constants/faqs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type FAQContent = {
  question: string;
  answer: string;
  category: string;
};

// --- FAQs ---

export async function getFAQs() {
  const faqs = await prisma.cMSContent.findMany({
    where: {
      type: "FAQ",
      status: { not: "ARCHIVED" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { name: true, email: true },
      },
    },
  });

  return faqs.map((faq) => ({
    id: faq.id,
    slug: faq.slug, // Although not strictly used for FAQs, useful for uniqueness
    title: faq.title, // Question can be title
    status: faq.status,
    authorName: faq.author.name,
    updatedAt: faq.updatedAt,
    content: faq.content as unknown as FAQContent,
  }));
}

export async function upsertFAQ(data: {
  id?: string;
  question: string;
  answer: string;
  category: string;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  const slug = `faq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const content: FAQContent = {
    question: data.question,
    answer: data.answer,
    category: data.category,
  };

  if (data.id) {
    // Update
    await prisma.cMSContent.update({
      where: { id: data.id },
      data: {
        title: data.question, // Keep title in sync with question
        content: content as any, // Prisma Json type
      },
    });
  } else {
    // Create
    await prisma.cMSContent.create({
      data: {
        type: "FAQ",
        slug: slug,
        title: data.question,
        content: content as any,
        status: "PUBLISHED",
        authorId: session.user.id,
      },
    });
  }

  revalidatePath("/super-admin/cms/faqs");
  revalidatePath("/faqs");
}

export async function deleteFAQ(id: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.cMSContent.delete({
    where: { id },
  });

  revalidatePath("/super-admin/cms/faqs");
  revalidatePath("/faqs");
}

export async function seedFAQs() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  // Check if FAQs already exist to prevent duplicates if run multiple times
  const existingCount = await prisma.cMSContent.count({
    where: { type: "FAQ" },
  });

  if (existingCount > 0) {
    return {
      success: false,
      message: "FAQs already exist. Clear them first to seed.",
    };
  }

  const userId = session.user.id;

  for (const faq of faqData) {
    const slug = `faq-${Math.random().toString(36).substr(2, 9)}`;
    const content: FAQContent = {
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    };

    await prisma.cMSContent.create({
      data: {
        type: "FAQ",
        slug,
        title: faq.question,
        content: content as any,
        status: "PUBLISHED",
        authorId: userId,
      },
    });
  }

  revalidatePath("/super-admin/cms/faqs");
  revalidatePath("/faqs");
  return {
    success: true,
    message: `Seeded ${faqData.length} FAQs successfully.`,
  };
}
