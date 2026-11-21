/**
 * The one switch for search engines. Until cutover (milestone 26) every page is
 * noindex and robots.txt disallows everything, so previews never compete with
 * the live WordPress site. Set ALLOW_INDEXING=true on the production deployment
 * at cutover.
 */
export const indexingAllowed = () => process.env.ALLOW_INDEXING === "true";
