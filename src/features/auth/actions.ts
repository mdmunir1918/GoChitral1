"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";

import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  guideApplicationSchema,
  hotelApplicationSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  readFormText,
  touristRegistrationSchema,
  type AuthActionState,
} from "@/features/auth/schemas";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";

function formValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, readFormText(formData, key)]));
}

function invalidFormMessage() {
  return "Check the information in the form and try again.";
}

function isDuplicateEmail(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function registerTourist(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (await auth()) return { error: "Sign out before registering a separate account." };

  const parsed = touristRegistrationSchema.safeParse(
    formValues(formData, ["name", "email", "password"]),
  );
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? invalidFormMessage() };

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        accountType: "TOURIST",
      },
    });
  } catch (error) {
    if (isDuplicateEmail(error)) return { status: "EMAIL_EXISTS" };
    return { error: "We couldn't create your account. Please try again." };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/auth/continue",
  });
  return {};
}

export async function applyAsGuide(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (await auth()) return { error: "Your account type can't be changed. Sign out to register another account." };

  const parsed = guideApplicationSchema.safeParse(
    formValues(formData, [
      "name", "email", "password", "phone", "whatsapp", "biography",
      "experienceYears", "languages", "regionsCovered", "specialties", "services",
      "verificationDetails",
    ]),
  );
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? invalidFormMessage() };

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        accountType: "TOUR_GUIDE",
        guideApplication: {
          create: {
            phone: parsed.data.phone,
            whatsapp: parsed.data.whatsapp,
            biography: parsed.data.biography,
            experienceYears: parsed.data.experienceYears,
            languages: parsed.data.languages,
            regionsCovered: parsed.data.regionsCovered,
            specialties: parsed.data.specialties,
            services: parsed.data.services,
            verificationDetails: parsed.data.verificationDetails,
            status: "PENDING",
          },
        },
      },
    });
  } catch (error) {
    if (isDuplicateEmail(error)) return { status: "EMAIL_EXISTS" };
    return { error: "We couldn't submit your application. Please try again." };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/auth/continue",
  });
  return {};
}

export async function applyAsHotelOwner(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (await auth()) return { error: "Your account type can't be changed. Sign out to register another account." };

  const parsed = hotelApplicationSchema.safeParse(
    formValues(formData, [
      "ownerName", "email", "password", "phone", "whatsapp", "hotelName",
      "hotelLocation", "hotelDescription", "businessDetails", "verificationDetails",
    ]),
  );
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? invalidFormMessage() };

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        name: parsed.data.ownerName,
        email: parsed.data.email,
        passwordHash,
        accountType: "HOTEL_OWNER",
        hotelApplication: {
          create: {
            phone: parsed.data.phone,
            whatsapp: parsed.data.whatsapp,
            hotelName: parsed.data.hotelName,
            hotelLocation: parsed.data.hotelLocation,
            hotelDescription: parsed.data.hotelDescription,
            businessDetails: parsed.data.businessDetails,
            verificationDetails: parsed.data.verificationDetails,
            status: "PENDING",
          },
        },
      },
    });
  } catch (error) {
    if (isDuplicateEmail(error)) return { status: "EMAIL_EXISTS" };
    return { error: "We couldn't submit your application. Please try again." };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/auth/continue",
  });
  return {};
}

export async function requestPasswordReset(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = passwordResetRequestSchema.safeParse({ email: readFormText(formData, "email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };

  const appUrl = process.env.APP_URL;
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !appUrl) {
    return { error: "Password reset email is not set up yet. Please contact support." };
  }

  let resetUrlBase: URL;
  try {
    resetUrlBase = new URL(appUrl);
    if (resetUrlBase.protocol !== "https:" && process.env.NODE_ENV === "production") {
      return { error: "Password reset email is not available right now. Please contact support." };
    }
  } catch {
    return { error: "Password reset email is not available right now. Please contact support." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true } });
    if (user?.email) {
      const now = new Date();
      const existing = await prisma.passwordResetToken.findUnique({ where: { userId: user.id }, select: { id: true, createdAt: true } });
      if (!existing || now.getTime() - existing.createdAt.getTime() >= 60_000) {
        const token = randomBytes(32).toString("base64url");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(now.getTime() + 30 * 60_000);
        const resetToken = await prisma.passwordResetToken.upsert({
          where: { userId: user.id },
          create: { userId: user.id, tokenHash, expiresAt },
          update: { tokenHash, expiresAt, createdAt: now },
          select: { id: true },
        });
        const resetUrl = new URL("/reset-password", resetUrlBase);
        resetUrl.searchParams.set("token", token);
        try {
          await sendPasswordResetEmail(user.email, resetUrl.toString());
        } catch (error) {
          await prisma.passwordResetToken.deleteMany({ where: { id: resetToken.id } });
          console.error("Password reset email delivery failed", error instanceof Error ? error.message : "Unknown email delivery error.");
        }
      }
    }
  } catch (error) {
    console.error("Password reset request could not be processed", error instanceof Error ? error.name : "Unknown error");
  }

  return { status: "RESET_REQUESTED" };
}

export async function resetPassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = passwordResetSchema.safeParse({
    token: readFormText(formData, "token"),
    password: readFormText(formData, "password"),
    confirmPassword: readFormText(formData, "confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the password and try again." };

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const now = new Date();
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true, expiresAt: true } });
    if (!resetToken || resetToken.expiresAt <= now) {
      return { error: "This reset link has expired or was already used. Request a new link below." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const updated = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.passwordResetToken.deleteMany({
        where: { id: resetToken.id, tokenHash, expiresAt: { gt: now } },
      });
      if (claimed.count !== 1) return false;
      await transaction.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
      return true;
    });
    if (!updated) return { error: "This reset link has expired or was already used. Request a new link below." };
    return { status: "PASSWORD_RESET" };
  } catch {
    return { error: "We couldn't update your password right now. Please try again." };
  }
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(formValues(formData, ["email", "password"]));
  if (!parsed.success) return { error: "Enter your email and password." };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/auth/continue",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Email or password is incorrect." };
    throw error;
  }

  return {};
}

export async function signInWithGoogle() {
  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) return;
  await signIn("google", { redirectTo: "/auth/continue" });
}

export async function logout() {
  await signOut({ redirectTo: "/login?loggedOut=1" });
}
