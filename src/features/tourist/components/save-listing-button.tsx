import Link from "next/link";
import { auth } from "@/auth";
import { saveListing } from "@/features/tourist/actions";

export async function SaveListingButton({ type, listingId }: { type: "PLACE" | "ACTIVITY" | "HOTEL" | "GUIDE"; listingId: string }) {
  const session = await auth();
  if (!session?.user) {
    return <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold hover:border-primary hover:text-primary">Sign in to save</Link>;
  }
  if (session.user.accountType !== "TOURIST") return null;
  return (
    <form action={saveListing}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="listingId" value={listingId} />
      <button className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold hover:border-primary hover:text-primary">Save to my places</button>
    </form>
  );
}
