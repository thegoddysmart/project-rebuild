import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function generateEventCode(title: string): string {
  const words = title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/);
  let code = "";

  if (words.length >= 2) {
    code = words
      .slice(0, 2)
      .map((w) => w.charAt(0))
      .join("");
  } else if (words.length === 1) {
    code = words[0].slice(0, 2);
  }

  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();

  return `${code}${year}${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizerId = session.user.organizerId;

    if (!organizerId) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      organizerId,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { eventCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        categories: {
          select: {
            id: true,
            _count: {
              select: { candidates: true },
            },
          },
        },
        ticketTypes: {
          select: {
            id: true,
            quantity: true,
            soldCount: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedEvents = events.map((event) => ({
      id: event.id,
      eventCode: event.eventCode,
      title: event.title,
      type: event.type,
      status: event.status,
      coverImage: event.coverImage,
      startDate: event.startDate,
      endDate: event.endDate,
      votePrice: event.votePrice ? Number(event.votePrice) : null,
      totalVotes: event.totalVotes,
      totalRevenue: Number(event.totalRevenue),
      categoriesCount: event.categories.length,
      candidatesCount: event.categories.reduce(
        (acc: number, cat: { _count: { candidates: number } }) =>
          acc + cat._count.candidates,
        0
      ),
      ticketTypesCount: event.ticketTypes.length,
      ticketsSold: event.ticketTypes.reduce(
        (acc: number, ticket: { soldCount: number }) => acc + ticket.soldCount,
        0
      ),
      transactionsCount: event._count.transactions,
      createdAt: event.createdAt,
      publishedAt: event.publishedAt,
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizerId = session.user.organizerId;

    if (!organizerId) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      venue,
      isPublic,
      votePrice,
      minVotes,
      maxVotes,
      allowNominations,
      ticketTypes,
      categories,
      nominationSettings,
    } = body;

    if (!title || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["VOTING", "TICKETING", "HYBRID"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    if (
      (type === "VOTING" || type === "HYBRID") &&
      (!votePrice || votePrice <= 0)
    ) {
      return NextResponse.json(
        { error: "Vote price is required for voting events" },
        { status: 400 }
      );
    }

    if (type === "TICKETING" || type === "HYBRID") {
      if (!ticketTypes || ticketTypes.length === 0) {
        return NextResponse.json(
          {
            error: "At least one ticket type is required for ticketing events",
          },
          { status: 400 }
        );
      }
      for (const ticket of ticketTypes) {
        if (!ticket.name?.trim()) {
          return NextResponse.json(
            { error: "All ticket types must have a name" },
            { status: 400 }
          );
        }
        if (typeof ticket.price !== "number" || ticket.price < 0) {
          return NextResponse.json(
            { error: "All ticket types must have a valid price" },
            { status: 400 }
          );
        }
        if (typeof ticket.quantity !== "number" || ticket.quantity < 1) {
          return NextResponse.json(
            { error: "All ticket types must have a valid quantity" },
            { status: 400 }
          );
        }
      }
    }

    if (type === "VOTING" || type === "HYBRID") {
      if (!categories || categories.length === 0) {
        return NextResponse.json(
          { error: "At least one category is required for voting events" },
          { status: 400 }
        );
      }
      for (const category of categories) {
        if (!category.name?.trim()) {
          return NextResponse.json(
            { error: "All categories must have a name" },
            { status: 400 }
          );
        }
        // REMOVED: Candidate check to allow setup first, populate later
        // if (!category.candidates || category.candidates.length === 0) { ... }
        for (const candidate of category.candidates) {
          if (!candidate.name?.trim() || !candidate.code?.trim()) {
            return NextResponse.json(
              { error: "All candidates must have a name and code" },
              { status: 400 }
            );
          }
        }
      }
    }

    const createEventData = (eventCode: string) => ({
      eventCode,
      title,
      description,
      type,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      location,
      venue,
      isPublic: isPublic ?? true,
      votePrice: type === "VOTING" || type === "HYBRID" ? votePrice : null,
      minVotes: minVotes ?? 1,
      maxVotes,
      allowNominations: allowNominations ?? false,
      organizerId,
      categories:
        (type === "VOTING" || type === "HYBRID") && categories?.length > 0
          ? {
              create: categories.map(
                (
                  cat: {
                    name: string;
                    description?: string;
                    sortOrder?: number;
                    candidates?: Array<{
                      code: string;
                      name: string;
                      bio?: string;
                      sortOrder?: number;
                    }>;
                  },
                  catIndex: number
                ) => ({
                  name: cat.name,
                  description: cat.description,
                  sortOrder: cat.sortOrder ?? catIndex,
                  candidates:
                    cat.candidates && cat.candidates.length > 0
                      ? {
                          create: cat.candidates.map(
                            (
                              cand: {
                                code: string;
                                name: string;
                                bio?: string;
                                sortOrder?: number;
                              },
                              candIndex: number
                            ) => ({
                              code: cand.code,
                              name: cand.name,
                              bio: cand.bio,
                              sortOrder: cand.sortOrder ?? candIndex,
                            })
                          ),
                        }
                      : undefined,
                })
              ),
            }
          : undefined,
      nominationForm:
        (type === "VOTING" || type === "HYBRID") && nominationSettings
          ? {
              create: {
                isActive: nominationSettings.isActive,
                whatsappLink: nominationSettings.whatsappLink,
                fields: {
                  create: nominationSettings.fields.map(
                    (
                      f: {
                        label: string;
                        type: string;
                        required: boolean;
                        options?: string[];
                      },
                      index: number
                    ) => ({
                      key: `field_${Date.now()}_${index}`,
                      label: f.label,
                      type: f.type as any,
                      required: f.required,
                      options: f.options,
                      order: index,
                    })
                  ),
                },
              },
            }
          : undefined,
      ticketTypes:
        (type === "TICKETING" || type === "HYBRID") && ticketTypes?.length > 0
          ? {
              create: ticketTypes.map(
                (
                  ticket: {
                    name: string;
                    description?: string;
                    price: number;
                    quantity: number;
                    maxPerOrder?: number;
                    sortOrder?: number;
                  },
                  index: number
                ) => ({
                  name: ticket.name,
                  description: ticket.description,
                  price: ticket.price,
                  quantity: ticket.quantity,
                  maxPerOrder: ticket.maxPerOrder ?? 10,
                  sortOrder: ticket.sortOrder ?? index,
                })
              ),
            }
          : undefined,
    });

    const includeOptions = {
      categories: {
        include: {
          candidates: true,
        },
      },
      ticketTypes: true,
    };

    let event;
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
      let eventCode = generateEventCode(title);
      if (retryCount > 0) {
        eventCode = eventCode + retryCount.toString();
      }

      try {
        event = await prisma.event.create({
          data: createEventData(eventCode),
          include: includeOptions,
        });
        break;
      } catch (err: unknown) {
        const prismaError = err as { code?: string };
        if (prismaError.code === "P2002") {
          retryCount++;
          if (retryCount >= maxRetries) {
            return NextResponse.json(
              {
                error:
                  "Unable to generate unique event code. Please try again.",
              },
              { status: 500 }
            );
          }
        } else {
          throw err;
        }
      }
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
