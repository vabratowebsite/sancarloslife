import type { Img } from "@/components/sections";

/**
 * Photos used by the code pages. They live in the Media library (uploaded by
 * the WordPress import), so paths are /api/media/file/<file>; the sizes are the
 * resized copies Payload makes (hero 1920 wide, card 768×512).
 */
const f = (file: string, width: number, height: number, alt = ""): Img => ({ src: `/api/media/file/${file}`, width, height, alt });

export const IMAGES = {
  homeHero: f("mark-martinho-and-viv-kelvin-at-the-san-carlos-murale-bianchini-market-1920x1080.jpg", 1920, 1080),
  homeAgents: f(
    "mark-martinho-and-viv-kelvin-at-the-museum-of-san-carlos-history-san-carlos-ca-photo-by-vabrato-real-estate-services-c-768x512.jpg",
    768,
    512,
    "Viv Kelvin and Mark Martinho of Vabrato Real Estate",
  ),
  aboutHero: f("mark-martinho-and-viv-kelvin-at-the-laurel-street-murale-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg", 1200, 608),
  centralMiddleSchool: f(
    "central-middle-school-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg",
    1200,
    800,
    "Central Middle School sign: a California Distinguished School",
  ),
  exploreRestaurants: f("doppio-zero-san-carlos-ca-scaled-768x512.jpg", 768, 512),
  exploreAttractions: f("Flying-Car-eVTOL-Hiller-Aviation-San-Carlos-1-768x512.jpg", 768, 512),
  exploreEvents: f("night-of-holiday-lights-2022-at-laurel-street-san-carlos-ca-december-friday-photo-by-vabrato-real-estate-9-768x512.jpg", 768, 512),
  exploreParks: f("san-carlos-youth-center-at-burton-park-in-howard-park-san-carlos-ca-photo-by-vabrato-real-estate-services-2-768x512.jpg", 768, 512),
  vivMarkHero: f("viv-kelvin-and-mark-martinho-of-vabrato-real-estate-san-carlos-realtors.jpg", 687, 458),
  viv: f("viv-kelvin-of-vabrato-real-estate-san-carlos-realtors.jpg", 437, 506),
  mark: f("mark-martinho-of-vabrato-real-estate-san-carlos-realtors.jpg", 439, 506),
} satisfies Record<string, Img>;
