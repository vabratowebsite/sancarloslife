/** The /videos-of-san-carlos-ca/ page, as code. Each video needs its 11-character YouTube id. */
export const VIDEOS_INTRO = "Short videos of San Carlos restaurants, shops and corners of Laurel Street, filmed by Viv and Mark.";

export const VIDEO_SECTIONS: { id: string; title: string; playlistId?: string; videos: { youtubeId: string; title: string }[] }[] = [
  {
    id: "restaurants",
    title: "Restaurant Videos",
    playlistId: "PLsRWE7Kw28negVcvsvIjhXrqmtMwicJr3",
    videos: [
      { youtubeId: "LlvAFHWqcMQ", title: "Fancy some sushi? 🍣 #shorts" },
      { youtubeId: "pICpoWGCkFc", title: "BEST Burrata in San Carlos, CA! #shorts" },
      { youtubeId: "17j89UG7M7A", title: "Must Try Italian Gelato in San Carlos, CA 🍦#gelato #realtorlife" },
      { youtubeId: "GEzQnPCrOJw", title: "3-Course Meal for only $20?!! 🍽😲😋 #foodies #cityofgoodliving" },
      { youtubeId: "nFQ3KqWpyWo", title: "Would you like some coffee? ☕🤩" },
      { youtubeId: "NUgfqv92JAE", title: "Heavenly Salad at San Carlos, CA 🥗" },
      { youtubeId: "zEargzXg7YM", title: "Cocktail o'clock in San Carlos, CA 🥂 #realtorlife #localbusiness" },
      { youtubeId: "yHtxH3aXCpo", title: "Delizie Italian Restaurant at San Carlos CA" },
      { youtubeId: "1QAmyHwOzts", title: "Blind Tasting Restaurant and Bar at San Carlos CA" },
      { youtubeId: "OWlYwNqdig0", title: "Cuisinett French Restaurant in San Carlos CA" },
      { youtubeId: "C_kExMdsNBo", title: "Laurel Street Art in San Carlos CA" },
      { youtubeId: "_ZTZEDQtEpw", title: "Tutti Frutti Yogurts in San Carlos CA" },
      { youtubeId: "yOcfo-MXGCw", title: "Stamp Bar & Brill at Laurel Street, San Carlos CA" },
      { youtubeId: "OyJDjiKWOow", title: "Pylos Greek Restaurant in Laurel Street, San Carlos CA" },
      { youtubeId: "nH0c-fN0k_M", title: "The Living Room in San Carlos CA" },
    ],
  },
];
