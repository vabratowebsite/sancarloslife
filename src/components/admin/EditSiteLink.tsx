/** Admin sidebar link: opens the site in edit mode (the on-page editor). */
export function EditSiteLink() {
  // A plain link on purpose: /edit/ turns edit mode on, so it must not be prefetched.
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/edit/?path=/" style={{ display: "block", margin: "12px 0", fontWeight: 600 }}>
      Edit site pages →
    </a>
  );
}
