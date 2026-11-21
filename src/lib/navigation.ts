// Main menu, copied from the live site's menu (Nov 2026) so every URL is kept.
export type NavLink = { label: string; href: string };
export type NavItem = NavLink & { children?: NavLink[] };

export const mainNav: NavItem[] = [
  {
    label: "About San Carlos",
    href: "/about-san-carlos/",
    children: [
      { label: "Introduction", href: "/about-san-carlos/" },
      { label: "Living in San Carlos", href: "/living-in-san-carlos-ca-the-complete-guide/" },
      { label: "History of San Carlos", href: "/history-of-san-carlos/" },
      { label: "Restaurants and Services", href: "/restaurants-and-services/" },
      { label: "Attractions", href: "/attractions/" },
      { label: "Parks and Trails", href: "/parks-of-san-carlos/" },
      { label: "City Projects", href: "/city-projects/" },
    ],
  },
  {
    label: "Events",
    href: "/events/",
    children: [
      { label: "Community Calendar", href: "/events/" },
      { label: "Annual Events", href: "/events-and-activities/" },
      { label: "San Carlos Hometown Days", href: "/hometown-days/" },
      { label: "Centennial Celebrations 2025", href: "/san-carlos-centennial-2025-celebrating-100-years/" },
      { label: "Submit an Event", href: "/events/submit/" },
    ],
  },
  { label: "Blog", href: "/san-carlos-life-blog/" },
  {
    label: "Neighborhoods",
    href: "/the-neighborhood/",
    children: [
      { label: "Alder Manor", href: "/alder-manor/" },
      { label: "Beverly Terrace", href: "/beverly-terrace/" },
      { label: "Clearfield Park", href: "/clearfield-park/" },
      { label: "Cordes", href: "/cordes/" },
      { label: "El Sereno (White Oaks)", href: "/el-sereno/" },
      { label: "Howard Park", href: "/howard-park/" },
    ],
  },
  {
    label: "Real Estate",
    href: "/san-carlos-ca-real-estate-and-homes-for-sale/",
    children: [
      { label: "Real Estate in San Carlos", href: "/san-carlos-ca-real-estate-and-homes-for-sale/" },
      { label: "Search Homes for Sale", href: "/homes-for-sale-in-san-carlos-ca/" },
      { label: "Open Houses", href: "/open-houses-in-san-carlos-ca/" },
      { label: "Market Overview", href: "/san-carlos-ca-real-estate-market-trends/" },
      { label: "What's My Home Worth?", href: "/sell-my-house/" },
      { label: "Buyer and Seller Guides", href: "/buyers-and-sellers-guides/" },
      { label: "Mortgage Calculator", href: "/how-much-house-can-i-afford-mortgage-calculator/" },
    ],
  },
  {
    label: "Media",
    href: "/gallery/",
    children: [
      { label: "Photo Gallery", href: "/gallery/" },
      { label: "Video Gallery", href: "/videos-of-san-carlos-ca/" },
    ],
  },
  { label: "Viv & Mark", href: "/one-of-the-best-realtor-teams-in-san-carlos-ca/" },
];

// Used until the Settings global is filled in (values from the live site).
export const defaultContact = {
  phone: "+1 650 291 7241",
  email: "hello@sancarloslife.com",
  social: [
    { platform: "facebook", url: "https://www.facebook.com/sancarloslife" },
    { platform: "instagram", url: "https://www.instagram.com/sancarloslife/" },
    { platform: "youtube", url: "https://www.youtube.com/channel/UCK5b9EEXChGFvuo-0XdaLsg" },
  ],
};

export const defaultFooterColumns: { heading: string; links: NavLink[] }[] = [
  {
    heading: "About San Carlos",
    links: [
      { label: "Welcome", href: "/about-san-carlos/" },
      { label: "Living in San Carlos", href: "/living-in-san-carlos-ca-the-complete-guide/" },
      { label: "History", href: "/history-of-san-carlos/" },
      { label: "City Projects", href: "/city-projects/" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Restaurants & Services", href: "/restaurants-and-services/" },
      { label: "Parks & Trails", href: "/parks-of-san-carlos/" },
      { label: "Attractions", href: "/attractions/" },
      { label: "Events", href: "/events/" },
    ],
  },
  {
    heading: "Real Estate",
    links: [
      { label: "Homes for Sale", href: "/homes-for-sale-in-san-carlos-ca/" },
      { label: "Open Houses", href: "/open-houses-in-san-carlos-ca/" },
      { label: "Market Overview", href: "/san-carlos-ca-real-estate-market-trends/" },
      { label: "Sell My House", href: "/sell-my-house/" },
    ],
  },
  {
    heading: "Media",
    links: [
      { label: "Blog", href: "/san-carlos-life-blog/" },
      { label: "Videos", href: "/videos-of-san-carlos-ca/" },
      { label: "Gallery", href: "/gallery/" },
      { label: "Subscribe", href: "/subscribe/" },
    ],
  },
];

export const legalLinks: NavLink[] = [
  { label: "Privacy", href: "/privacy-policy/" },
  { label: "Terms", href: "/terms-of-service/" },
  { label: "Cookie Policy", href: "/cookie-policy/" },
  { label: "Site Map", href: "/site-map/" },
];
