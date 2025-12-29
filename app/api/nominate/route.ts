import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      category,
      fullName,
      stageName,
      bio,
      email,
      phone,
      socialHandle,
    } = body;

    // 1. Basic Validation
    if (!eventId || !category || !fullName || !stageName || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Fetch Event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 3. Create Nomination Record
    // Typically we might want to upload the image first and pass the URL here.
    // Since the form simulates upload or we don't have an upload handler yet,
    // we'll leave image as null for this MVP step or handle separate upload logic later.
    // For this fix, we focus on saving the text data.

    const nomination = await prisma.nomination.create({
      data: {
        eventId: event.id,
        categoryName: category,
        nomineeName: stageName, // Using Stage Name as primary name
        nomineeEmail: email,
        nomineePhone: phone,
        // Using nominator fields for the applicant themselves if self-nominating,
        // or we can map them differently. The schema has nominatorName.
        // We'll assume self-nomination or map form fields to available schema fields.
        nominatorName: fullName, // Legal Name
        nominatorEmail: email,
        nominatorPhone: phone,
        reason: bio,
        metadata: {
          socialHandle,
        },
        status: "PENDING",
      },
    });

    // Generate a reference code based on ID
    const reference = `NOM-${nomination.id.slice(-6).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      reference,
      id: nomination.id,
    });
  } catch (error) {
    console.error("Nomination Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
