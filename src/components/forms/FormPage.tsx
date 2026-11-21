import { Breadcrumbs, type Crumb } from "@/components/content/Breadcrumbs";

/** Simple frame for a form page: heading, intro, the form, optional aside. */
export function FormPage({
  title,
  intro,
  crumbs,
  aside,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  crumbs: Crumb[];
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="container-site grid grid-cols-[minmax(0,1fr)] gap-10 py-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
      <div className="min-w-0">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-3 text-h2 md:text-h1">{title}</h1>
        <div className="mt-3 max-w-2xl text-ink-500">{intro}</div>
        <div className="mt-8">{children}</div>
      </div>
      {aside && <div className="grid content-start gap-6">{aside}</div>}
    </div>
  );
}
