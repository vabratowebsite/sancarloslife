import type { GlobalConfig } from "payload";

import { anyone, staffOnly } from "../access/roles";
import { revalidateGlobal } from "../hooks/revalidate";

/** The /videos-of-san-carlos-ca/ page: sections of YouTube videos and playlists. */
export const VideosPage: GlobalConfig = {
  slug: "videos-page",
  label: "Videos page",
  admin: { group: "Content" },
  access: { read: anyone, update: staffOnly },
  hooks: { afterChange: [revalidateGlobal("videos-page")] },
  fields: [
    { name: "intro", type: "textarea" },
    {
      name: "sections",
      type: "array",
      fields: [
        { name: "title", type: "text", required: true },
        {
          name: "playlistId",
          type: "text",
          admin: { description: "Optional YouTube playlist id (starts with PL). Shown as a player above the videos." },
        },
        {
          name: "videos",
          type: "array",
          fields: [
            {
              type: "row",
              fields: [
                { name: "youtubeId", type: "text", required: true, admin: { description: "The 11-character id from the YouTube link" } },
                { name: "title", type: "text", required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
};
