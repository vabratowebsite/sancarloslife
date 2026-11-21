/** Dashboard banner: where page text and photos are edited now. */
export function EditSiteBanner() {
  return (
    <div style={{ margin: "0 0 24px", padding: "16px 20px", borderRadius: 8, background: "#E6F4F4", border: "1px solid #1F7A7A" }}>
      <p style={{ margin: 0, fontWeight: 600 }}>Change words and photos on the site&rsquo;s pages</p>
      <p style={{ margin: "4px 0 12px" }}>
        Open any page, press Edit text, click what you want to change, and Save. Versions keeps the last 10 saves. Posts, events, places and
        neighborhoods are edited here in the admin.
      </p>
      {/* A plain link on purpose: /edit/ turns edit mode on, so it must not be prefetched. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/edit/?path=/" style={{ display: "inline-block", padding: "8px 14px", borderRadius: 6, background: "#1F7A7A", color: "#fff", fontWeight: 600 }}>
        Edit site pages →
      </a>
    </div>
  );
}
