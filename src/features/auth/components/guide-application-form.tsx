"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthActionError, TextAreaField, TextField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { applyAsGuide } from "@/features/auth/actions";
import { ExistingAccountMessage } from "./existing-account-message";

export function GuideApplicationForm() {
  const [state, action, pending] = useActionState(applyAsGuide, {});

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Your name" name="name" autoComplete="name" required maxLength={100} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
      </div>
      <TextField label="Password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Phone number" name="phone" type="tel" autoComplete="tel" required />
        <TextField label="WhatsApp number" name="whatsapp" type="tel" required />
      </div>
      <TextAreaField label="Short biography" name="biography" minLength={30} maxLength={3000} required />
      <TextField label="Years of experience" name="experienceYears" type="number" min={0} max={70} required />
      <TextField label="Languages" name="languages" placeholder="Khowar, Urdu, English" required />
      <TextField label="Regions covered" name="regionsCovered" placeholder="Chitral, Kalash Valleys, Mastuj" required />
      <TextField label="Specialties" name="specialties" placeholder="Trekking, culture, wildlife" required />
      <TextField label="Services offered" name="services" placeholder="Local guiding, transport coordination" required />
      <TextAreaField label="Supporting verification information" name="verificationDetails" minLength={15} maxLength={2000} required />
      <p className="-mt-3 text-xs leading-5 text-stone-500">Do not include passwords, financial details, or government ID numbers here. Applications are private and begin pending review.</p>
      {state.status === "EMAIL_EXISTS" ? <ExistingAccountMessage /> : <AuthActionError message={state.error} />}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Submitting…" : "Submit guide application"}</Button>
      <p className="text-center text-sm text-stone-500">Already have an account? <Link className="font-medium text-emerald-900 hover:underline" href="/login">Sign in</Link></p>
    </form>
  );
}
