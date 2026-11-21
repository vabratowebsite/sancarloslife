import type { GlobalConfig } from "payload";

import { anyone, staffOnly } from "../access/roles";
import { revalidateGlobal } from "../hooks/revalidate";

/**
 * Editable copy for the home page. Everything else on the page (events, posts,
 * neighborhoods) comes from the collections automatically.
 */
export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home page",
  admin: { group: "Content" },
  access: { read: anyone, update: staffOnly },
  hooks: { afterChange: [revalidateGlobal("home-page")] },
  fields: [
    {
      type: "collapsible",
      label: "Hero",
      fields: [
        { name: "heroEyebrow", type: "text", defaultValue: "Your guide to the City of Good Living" },
        { name: "heroTitle", type: "text", required: true, defaultValue: "This is San Carlos Life" },
        {
          name: "heroIntro",
          type: "textarea",
          defaultValue:
            "Events, restaurants, neighborhoods and homes for sale in San Carlos, California 94070. Don't miss the latest news in town.",
        },
        {
          name: "heroPoster",
          type: "upload",
          relationTo: "media",
          admin: { description: "Shown first and on phones; also the still frame when motion is reduced. Landscape, at least 1600px wide." },
        },
        {
          name: "heroVimeoId",
          type: "text",
          admin: { description: "Optional background video: the number at the end of the Vimeo link. Plays muted on larger screens, with a pause button." },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Buy or sell band",
      fields: [
        { name: "agentHeading", type: "text", defaultValue: "Thinking of buying or selling a home?" },
        {
          name: "agentText",
          type: "textarea",
          defaultValue: "Viv and Mark have 30+ years of combined experience and 95% of their clients come from referrals.",
        },
        { name: "agentPhoto", type: "upload", relationTo: "media" },
      ],
    },
    {
      type: "collapsible",
      label: "Subscribe band",
      fields: [
        { name: "subscribeHeading", type: "text", defaultValue: "Don't miss out" },
        { name: "subscribeText", type: "text", defaultValue: "One email a week with events, new restaurants, and what sold in San Carlos." },
      ],
    },
  ],
};
