import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/SubmitButton";
import { requireAccount, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveOwnerAccountAction, toggleOwnerAccountActiveAction } from "./actions";

type OwnerAccountsPageProps = {
  searchParams?: Promise<{
    saved?: string;
    deactivated?: string;
    reactivated?: string;
    error?: string;
  }>;
};

export default async function OwnerAccountsPage({ searchParams }: OwnerAccountsPageProps) {
  const user = await requireUser(["OWNER"]);
  const selectedAccount = await requireAccount(user);
  const params = await searchParams;
  const accounts = await prisma.account.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          users: true,
          orders: true,
          skuImageMappings: true,
          uploadBatches: true
        }
      }
    }
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Owner"
        title="Meesho accounts"
        description="Create and manage seller accounts. Orders, SKU mappings, image cache, workers, and reports stay scoped to the selected account."
        action={{ href: "/accounts", label: "Switch account" }}
      />

      {params?.saved || params?.deactivated || params?.reactivated ? (
        <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          Account updated.
        </div>
      ) : null}

      {params?.error ? (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Use a unique account name and code.
        </div>
      ) : null}

      <section className="mb-5 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected account</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-bold text-slate-950">{selectedAccount.name}</p>
            <p className="text-sm font-medium text-slate-500">{selectedAccount.code}</p>
          </div>
          <Link
            href="/accounts"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm"
          >
            Switch selected account
          </Link>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <form action={saveOwnerAccountAction} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Create account</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Use one account per Meesho seller login or operational brand. The account code becomes the short internal label.
          </p>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Account name</span>
              <input
                name="name"
                required
                placeholder="Sullery Jaipur"
                className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Account code</span>
              <input
                name="code"
                required
                placeholder="sullery-jaipur"
                className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 lowercase outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
              />
            </label>
            <label className="flex items-center gap-3 rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700">
              <input name="active" type="checkbox" defaultChecked className="h-5 w-5 accent-pink-700" />
              Active
            </label>
            <SubmitButton pendingText="Saving...">Create account</SubmitButton>
          </div>
        </form>

        <div className="space-y-4">
          {accounts.map((account) => (
            <article key={account.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950">{account.name}</h2>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${account.active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>
                      {account.active ? "Active" : "Inactive"}
                    </span>
                    {account.id === selectedAccount.id ? (
                      <span className="rounded-full bg-pink-50 px-2 py-1 text-xs font-semibold text-berry">Selected</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-500">{account.code}</p>
                </div>
                <form action={toggleOwnerAccountActiveAction}>
                  <input type="hidden" name="accountId" value={account.id} />
                  <input type="hidden" name="active" value={String(!account.active)} />
                  <button className="min-h-11 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                    {account.active ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Users</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{account._count.users}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orders</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{account._count.orders}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SKU images</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{account._count.skuImageMappings}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploads</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{account._count.uploadBatches}</p>
                </div>
              </div>

              <form action={saveOwnerAccountAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.8fr_auto_auto] sm:items-end">
                <input type="hidden" name="accountId" value={account.id} />
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Name</span>
                  <input
                    name="name"
                    defaultValue={account.name}
                    required
                    className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Code</span>
                  <input
                    name="code"
                    defaultValue={account.code}
                    required
                    className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 lowercase outline-none transition focus:border-berry focus:ring-2 focus:ring-pink-100"
                  />
                </label>
                <label className="flex min-h-11 items-center gap-2 rounded-md bg-slate-50 px-3 text-sm font-medium text-slate-700">
                  <input name="active" type="checkbox" defaultChecked={account.active} className="h-5 w-5 accent-pink-700" />
                  Active
                </label>
                <SubmitButton pendingText="Saving..." variant="secondary">
                  Save
                </SubmitButton>
              </form>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
