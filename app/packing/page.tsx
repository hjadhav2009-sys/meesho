import { AppShell } from "@/components/AppShell";
import { AwbBarcodeScanner } from "@/components/AwbBarcodeScanner";
import { PageHeader } from "@/components/PageHeader";
import { requireAccount, requireUser } from "@/lib/auth";
import { getPackingDashboard } from "@/lib/data";
import { searchAwbAction } from "./actions";

type PackingPageProps = {
  searchParams?: Promise<{
    error?: string;
    notFound?: string;
    multiple?: string;
    q?: string;
  }>;
};

export default async function PackingAwbPage({ searchParams }: PackingPageProps) {
  const user = await requireUser(["OWNER", "PACKER"]);
  const account = await requireAccount(user);
  const dashboard = await getPackingDashboard(account.id);
  const params = await searchParams;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Packer"
        title="Scan or search AWB"
        description="Scan the label or type the last 5 to 8 AWB characters."
      />

      <AwbBarcodeScanner action={searchAwbAction} defaultAwb={params?.q} />

      <section className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <span className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
          {account.name}
        </span>
        <span className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
          {user.name}
        </span>
        <span className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-sm font-semibold text-teal-700 ring-1 ring-teal-200">
          Packed today {dashboard.packedTodayCount}
        </span>
        <span className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-sm font-semibold text-berry ring-1 ring-pink-200">
          Pending {dashboard.pendingCount}
        </span>
      </section>

      {params?.error ? (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Enter a valid AWB.
        </div>
      ) : null}

      {params?.notFound ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          No order matched AWB {params.notFound}.
        </div>
      ) : null}

      {params?.multiple ? (
        <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          Multiple orders matched {params.q}. Choose the correct AWB from the live suggestions.
        </div>
      ) : null}

      {dashboard.pendingCount === 0 ? (
        <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700">
          No pending packing orders for this account.
        </div>
      ) : null}

    </AppShell>
  );
}
