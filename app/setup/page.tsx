import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { prisma } from "@/lib/prisma";
import { canUseFirstRunSetup } from "@/lib/setup";
import { createFirstOwnerAction } from "./actions";

export const dynamic = "force-dynamic";

type SetupPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function setupErrorMessage(error?: string) {
  if (error === "create") {
    return "Setup could not be completed. Check the account code and username, then try again.";
  }

  if (error === "invalid") {
    return "Enter valid setup details and use a password with at least 8 characters that is not demo1234.";
  }

  return null;
}

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const userCount = await prisma.user.count();

  if (!canUseFirstRunSetup(userCount)) {
    redirect("/login");
  }

  const params = await searchParams;
  const errorMessage = setupErrorMessage(params?.error);

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-berry">First-time setup</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Create the first owner</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This page is available only while the database has no users. Create the first account and owner login,
            then continue from the normal login page.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <form action={createFirstOwnerAction} className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Account name</span>
            <input
              name="accountName"
              defaultValue="Sullery"
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Account code</span>
            <input
              name="accountCode"
              defaultValue="sullery"
              pattern="[A-Za-z0-9-]{2,40}"
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Owner name</span>
            <input
              name="ownerName"
              autoComplete="name"
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              name="username"
              autoComplete="username"
              pattern="[A-Za-z0-9._-]{3,40}"
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Confirm password</span>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
              required
            />
          </label>

          <div className="sm:col-span-2">
            <SubmitButton pendingText="Creating setup...">Create owner account</SubmitButton>
          </div>
        </form>
      </section>
    </main>
  );
}
