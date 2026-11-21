import type { Card } from "@/components/sections";

import { IMAGES } from "./images";

/** The four "Explore the city" cards, shared by About San Carlos and Explore the City. */
export const EXPLORE_CARDS: Card[] = [
  {
    title: "Restaurants & Services",
    text: "Where to eat, shop and get things done, from Laurel Street to Industrial Road.",
    image: IMAGES.exploreRestaurants,
    label: "Browse all",
    href: "/restaurants-and-services/",
  },
  {
    title: "Attractions",
    text: "Museums, aviation, wineries and day trips in and around San Carlos.",
    image: IMAGES.exploreAttractions,
    label: "Browse all",
    href: "/attractions/",
  },
  {
    title: "Events & Activities",
    text: "Hometown Days, farmers markets, holiday lights and what's on this week.",
    image: IMAGES.exploreEvents,
    label: "Browse all",
    href: "/events/",
  },
  {
    title: "Parks & Trails",
    text: "Playgrounds, sports fields, dog areas and canyon hikes across the city.",
    image: IMAGES.exploreParks,
    label: "Browse all",
    href: "/parks-of-san-carlos/",
  },
];
