"use server";

import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const SignUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  businessName: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function signUpOrganizer(prevState: any, formData: FormData) {
  try {
    const rawData = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      businessName: formData.get("businessName"),
      password: formData.get("password"),
    };

    const validatedFields = SignUpSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid input data",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { fullName, email, phone, businessName, password } =
      validatedFields.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email already registered. Please login instead.",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User and OrganizerProfile in a transaction
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: fullName,
          email,
          passwordHash: hashedPassword, // Corrected field name
          role: "ORGANIZER",
          phone,
          status: "ACTIVE", // Or PENDING if you want email verification first
        },
      });

      await tx.organizerProfile.create({
        data: {
          userId: user.id,
          businessName,
          businessEmail: email,
          businessPhone: phone,
          verified: false, // Corrected field name and type (Boolean)
        },
      });
    });

    return { success: true, message: "Account created successfully!" };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
