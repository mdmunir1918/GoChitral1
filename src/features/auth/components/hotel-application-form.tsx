"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthActionError, TextAreaField, TextField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { applyAsHotelOwner } from "@/features/auth/actions";
import { ExistingAccountMessage } from "./existing-account-message";

export function HotelApplicationForm() {
  const [state, action, pending] = useActionState(applyAsHotelOwner, {});

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Owner name" name="ownerName" autoComplete="name" required maxLength={100} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
      </div>
      <TextField label="Password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Phone number" name="phone" type="tel" autoComplete="tel" required />
        <TextField label="WhatsApp number" name="whatsapp" type="tel" required />
      </div>
      <TextField label="Hotel name" name="hotelName" required maxLength={160} />
      <TextField label="Hotel location" name="hotelLocation" placeholder="Town or area in Chitral" required maxLength={300} />
      <TextAreaField label="Hotel description" name="hotelDescription" minLength={30} maxLength={3000} required />
      <TextAreaField label="Business details" name="businessDetails" minLength={15} maxLength={2000} required />
      <TextAreaField label="Supporting verification information" name="verificationDetails" minLength={15} maxLength={2000} required />
      <p className="-mt-3 text-xs leading-5 text-stone-500">Do not include passwords, financial details, or government ID numbers here. Applications are private and begin pending review.</p>
      {state.status === "EMAIL_EXISTS" ? <ExistingAccountMessage /> : <AuthActionError message={state.error} />}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Submitting…" : "Submit hotel application"}</Button>
      <p className="text-center text-sm text-stone-500">Already have an account? <Link className="font-medium text-emerald-900 hover:underline" href="/login">Sign in</Link></p>
    </form>
  );
}
