import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isGlobalAdmin =
      session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";

    if (!isGlobalAdmin && !session.user.organizerId) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    const whereClause = isGlobalAdmin
      ? { id }
      : { id, organizerId: session.user.organizerId };

    const event = await prisma.event.findFirst({
      where: whereClause,
      include: {
        categories: {
          include: {
            candidates: {
              orderBy: { voteCount: "desc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        ticketTypes: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            transactions: true,
            nominations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...event,
      votePrice: event.votePrice ? Number(event.votePrice) : null,
      totalRevenue: Number(event.totalRevenue),
      ticketTypes: event.ticketTypes.map((t) => ({
        ...t,
        price: Number(t.price),
      })),
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const isGlobalAdmin =
      session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";

    if (!isGlobalAdmin && !session.user.organizerId) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    const whereClause = isGlobalAdmin
      ? { id }
      : { id, organizerId: session.user.organizerId };

    const existingEvent = await prisma.event.findFirst({
      where: whereClause,
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let updateData: any = {
      title: body.title,
      description: body.description,
      type: body.type,
      coverImage: body.coverImage,
      bannerImage: body.bannerImage,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      votePrice: body.votePrice,
      minVotes: body.minVotes,
      maxVotes: body.maxVotes,
      location: body.location,
      venue: body.venue,
      isPublic: body.isPublic,
      allowNominations: body.allowNominations,
      nominationDeadline: body.nominationDeadline
        ? new Date(body.nominationDeadline)
        : null,
    };

    // RESTRICTION: If Event is LIVE and user is not Admin, restrict editable fields
    if (existingEvent.status === "LIVE" && !isGlobalAdmin) {
      const allowedFields = [
        "description",
        "coverImage",
        "bannerImage",
        "venue",
        "location",
        // We allow updating relations (categories/tickets) below, but restrict core event settings
      ];

      // Filter updateData to only allowed fields
      const filteredData: any = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }
      updateData = filteredData;
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    // Sync Ticket Types
    const { ticketTypes } = body;
    if (ticketTypes && Array.isArray(ticketTypes)) {
      const existingTicketTypes = await prisma.ticketType.findMany({
        where: { eventId: id },
      });
      const existingIds = existingTicketTypes.map((t) => t.id);
      const incomingIds = ticketTypes
        .filter((t: { id?: string }) => t.id)
        .map((t: { id: string }) => t.id);

      const toDelete = existingIds.filter((eId) => !incomingIds.includes(eId));
      if (toDelete.length > 0) {
        const ticketsWithSales = await prisma.ticketType.findMany({
          where: { id: { in: toDelete }, soldCount: { gt: 0 } },
        });
        if (ticketsWithSales.length > 0) {
          return NextResponse.json(
            { error: "Cannot delete ticket types that have sales" },
            { status: 400 }
          );
        }
        await prisma.ticketType.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      for (const ticket of ticketTypes) {
        if (ticket.id && existingIds.includes(ticket.id)) {
          await prisma.ticketType.update({
            where: { id: ticket.id },
            data: {
              name: ticket.name,
              description: ticket.description || null,
              price: ticket.price,
              quantity: ticket.quantity,
              maxPerOrder: ticket.maxPerOrder || 10,
            },
          });
        } else {
          await prisma.ticketType.create({
            data: {
              eventId: id,
              name: ticket.name,
              description: ticket.description || null,
              price: ticket.price,
              quantity: ticket.quantity,
              maxPerOrder: ticket.maxPerOrder || 10,
            },
          });
        }
      }
    }

    // Sync Categories and Candidates (New)
    const { categories } = body;
    if (categories && Array.isArray(categories)) {
      // 1. Identify categories to retain or delete
      const existingCategories = await prisma.eventCategory.findMany({
        where: { eventId: id },
        include: { candidates: true },
      });

      const existingCatIds = existingCategories.map((c) => c.id);
      const incomingCatIds = categories
        .filter((c: { id?: string }) => c.id)
        .map((c: { id: string }) => c.id);
      const catsToDelete = existingCatIds.filter(
        (id) => !incomingCatIds.includes(id)
      );

      if (catsToDelete.length > 0) {
        // Validation: Cannot delete categories with votes
        const catsWithVotes = await prisma.eventCategory.findMany({
          where: { id: { in: catsToDelete }, totalVotes: { gt: 0 } },
        });
        if (catsWithVotes.length > 0) {
          return NextResponse.json(
            {
              error: `Cannot delete category "${catsWithVotes[0].name}" because it has votes`,
            },
            { status: 400 }
          );
        }
        await prisma.eventCategory.deleteMany({
          where: { id: { in: catsToDelete } },
        });
      }

      // 2. Upsert Categories
      for (const [index, cat] of categories.entries()) {
        const categoryData = cat as {
          id?: string;
          name: string;
          description?: string;
          candidates?: Array<{
            id?: string;
            name: string;
            code: string;
            bio?: string;
            image?: string;
          }>;
        };

        let categoryId = categoryData.id;

        if (categoryId && existingCatIds.includes(categoryId)) {
          // Update existing category
          await prisma.eventCategory.update({
            where: { id: categoryId },
            data: {
              name: categoryData.name,
              description: categoryData.description || null,
              sortOrder: index,
            },
          });
        } else {
          // Create new category
          const newCat = await prisma.eventCategory.create({
            data: {
              eventId: id,
              name: categoryData.name,
              description: categoryData.description || null,
              sortOrder: index,
            },
          });
          categoryId = newCat.id;
        }

        // 3. Sync Candidates for this category
        if (categoryData.candidates && Array.isArray(categoryData.candidates)) {
          const currentCandidates = await prisma.candidate.findMany({
            where: { categoryId },
          });
          const currentCandIds = currentCandidates.map((c) => c.id);
          const incomingCandIds = categoryData.candidates
            .filter((c) => c.id)
            .map((c) => c.id as string);

          const candsToDelete = currentCandIds.filter(
            (id) => !incomingCandIds.includes(id)
          );

          if (candsToDelete.length > 0) {
            const candsWithVotes = await prisma.candidate.findMany({
              where: { id: { in: candsToDelete }, voteCount: { gt: 0 } },
            });
            if (candsWithVotes.length > 0) {
              return NextResponse.json(
                {
                  error: `Cannot delete candidate "${candsWithVotes[0].name}" because they have votes`,
                },
                { status: 400 }
              );
            }
            await prisma.candidate.deleteMany({
              where: { id: { in: candsToDelete } },
            });
          }

          for (const [cIndex, cand] of categoryData.candidates.entries()) {
            if (cand.id && currentCandIds.includes(cand.id)) {
              await prisma.candidate.update({
                where: { id: cand.id },
                data: {
                  name: cand.name,
                  bio: cand.bio || null,
                  image: cand.image || null,
                  sortOrder: cIndex,
                },
              });
            } else {
              await prisma.candidate.create({
                data: {
                  categoryId: categoryId!,
                  name: cand.name,
                  code: cand.code, // Must be provided (auto-generated by frontend)
                  bio: cand.bio || null,
                  image: cand.image || null,
                  sortOrder: cIndex,
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isGlobalAdmin =
      session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";

    if (!isGlobalAdmin && !session.user.organizerId) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    const whereClause = isGlobalAdmin
      ? { id }
      : { id, organizerId: session.user.organizerId };

    const event = await prisma.event.findFirst({
      where: whereClause,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === "LIVE" && !isGlobalAdmin) {
      return NextResponse.json(
        { error: "Cannot delete a live event. Please end the event first." },
        { status: 400 }
      );
    }

    if (event._count.transactions > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete an event with existing transactions. Please contact support.",
        },
        { status: 400 }
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
