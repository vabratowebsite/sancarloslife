import Link from "next/link";

/** Admin sidebar link: opens the site in edit mode (the on-page editor). */
export function EditSiteLink() {
  // A plain link on purpose: /edit/ turns edit mode on, so it must not be prefetched.
  return (
    <>
      <Link href="/admin/desk" style={{ display: "block", margin: "12px 0 4px", fontWeight: 600 }}>
        Operations Desk: approval queue →
      </Link>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/edit/?path=/" style={{ display: "block", margin: "4px 0 12px", fontWeight: 600 }}>
        Edit site pages →
      </a>
    </>
  );
}
