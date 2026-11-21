/** Old URLs that intentionally answer 410 Gone (no equivalent on the new site). */
export const GONE: RegExp[] = [
  // WP Go Maps' KML export for the old Google map; the new site has no map feed.
  /^\/locations\.kml\/?$/,
];
export const isGone = (pathname: string) => GONE.some((re) => re.test(pathname));
