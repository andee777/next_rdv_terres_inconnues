import { describe, expect, it } from "vitest";

import { episodes } from "@/data/episodes";
import type { Episode } from "@/lib/episode";
import {
  DEFAULT_FILTERS,
  countCountries,
  episodeTitle,
  episodeYear,
  filterEpisodes,
  groupByYear,
  hasActiveFilters,
  highlightRanges,
  hostFirstName,
  matchesQuery,
  normalize,
  sortEpisodes,
  tokenize,
  uniqueHosts,
} from "./episode-utils";

function make(overrides: Partial<Episode> & { episode: number }): Episode {
  return {
    animateur: "Frédéric Lopez",
    celebrite: "",
    peuple: "",
    destination: "Lieu",
    country: "Pays",
    diffusion_date: "1er janvier 2010",
    channel: "",
    coordinates: [0, 0],
    link: "",
    thumbnail: "",
    duration: "",
    views: "",
    ...overrides,
  };
}

describe("normalize / tokenize", () => {
  it("strips diacritics, lowercases and collapses whitespace", () => {
    expect(normalize("  Éthiopie   ÎLES  ")).toBe("ethiopie iles");
  });

  it("splits a query into normalized tokens", () => {
    expect(tokenize("Hauts  Plateaux")).toEqual(["hauts", "plateaux"]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("episodeTitle / episodeYear / hostFirstName", () => {
  it("prefixes the people with 'Les', or falls back to the destination", () => {
    expect(episodeTitle(make({ episode: 1, peuple: "Wauja" }))).toBe(
      "Les Wauja",
    );
    expect(episodeTitle(make({ episode: 1, destination: "Socotra" }))).toBe(
      "Socotra",
    );
  });

  it("parses the year from French dates", () => {
    expect(
      episodeYear(make({ episode: 1, diffusion_date: "1er septembre 2009" })),
    ).toBe(2009);
    expect(
      episodeYear(make({ episode: 1, diffusion_date: "26 décembre 2004" })),
    ).toBe(2004);
    expect(episodeYear(make({ episode: 1, diffusion_date: "" }))).toBeNull();
  });

  it("extracts a host's first name", () => {
    expect(hostFirstName("Raphaël de Casabianca")).toBe("Raphaël");
  });
});

describe("matchesQuery", () => {
  const episode = make({
    episode: 12,
    celebrite: "Gilbert Montagné",
    peuple: "Zanskarpas",
    destination: "Zanskar",
    country: "Inde",
    animateur: "Frédéric Lopez",
    diffusion_date: "1er septembre 2009",
  });

  it("matches everything for an empty query", () => {
    expect(matchesQuery(episode, "")).toBe(true);
    expect(matchesQuery(episode, "   ")).toBe(true);
  });

  it("ignores case and accents in both directions", () => {
    expect(matchesQuery(episode, "montagne")).toBe(true);
    expect(matchesQuery(episode, "FREDERIC")).toBe(true);
  });

  it("matches country, people, place, year and episode number", () => {
    for (const query of [
      "inde",
      "zanskarpas",
      "zanskar",
      "2009",
      "episode 12",
    ]) {
      expect(matchesQuery(episode, query), query).toBe(true);
    }
  });

  it("requires every word to match, in any order", () => {
    expect(matchesQuery(episode, "inde gilbert")).toBe(true);
    expect(matchesQuery(episode, "inde slimane")).toBe(false);
  });
});

describe("filterEpisodes", () => {
  const data = [
    make({
      episode: 1,
      animateur: "A",
      link: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
    }),
    make({ episode: 2, animateur: "B" }),
    make({ episode: 3, animateur: "A" }),
  ];

  it("returns everything with default filters", () => {
    expect(filterEpisodes(data, DEFAULT_FILTERS)).toHaveLength(3);
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it("filters by host", () => {
    const result = filterEpisodes(data, { ...DEFAULT_FILTERS, hosts: ["A"] });
    expect(result.map((e) => e.episode)).toEqual([1, 3]);
  });

  it("keeps only episodes with a video", () => {
    const result = filterEpisodes(data, {
      ...DEFAULT_FILTERS,
      onlyWithVideo: true,
    });
    expect(result.map((e) => e.episode)).toEqual([1]);
  });

  it("combines filters and reports them as active", () => {
    const filters = { ...DEFAULT_FILTERS, hosts: ["A"], onlyWithVideo: true };
    expect(filterEpisodes(data, filters).map((e) => e.episode)).toEqual([1]);
    expect(hasActiveFilters(filters)).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: "  " })).toBe(false);
  });
});

describe("sortEpisodes / groupByYear", () => {
  const data = [
    make({ episode: 1, diffusion_date: "5 mai 2005" }),
    make({ episode: 2, diffusion_date: "6 juin 2005" }),
    make({ episode: 3, diffusion_date: "7 juillet 2007" }),
  ];

  it("sorts newest first and oldest first without mutating the input", () => {
    expect(sortEpisodes(data, "newest").map((e) => e.episode)).toEqual([
      3, 2, 1,
    ]);
    expect(sortEpisodes(data, "oldest").map((e) => e.episode)).toEqual([
      1, 2, 3,
    ]);
    expect(data.map((e) => e.episode)).toEqual([1, 2, 3]);
  });

  it("groups consecutive episodes by year in the given order", () => {
    const groups = groupByYear(sortEpisodes(data, "newest"));
    expect(groups.map((g) => [g.year, g.episodes.length])).toEqual([
      [2007, 1],
      [2005, 2],
    ]);
  });

  it("puts episodes with an unknown year in their own group", () => {
    const groups = groupByYear([make({ episode: 9, diffusion_date: "" })]);
    expect(groups).toEqual([
      { year: null, episodes: [expect.objectContaining({ episode: 9 })] },
    ]);
  });
});

describe("highlightRanges", () => {
  it("finds accent-insensitive matches and merges overlaps", () => {
    expect(highlightRanges("Éthiopie", "ethio")).toEqual([[0, 5]]);
    expect(highlightRanges("Mongolie Mongole", "mong")).toEqual([
      [0, 4],
      [9, 13],
    ]);
    expect(highlightRanges("abcdef", "abc cde")).toEqual([[0, 5]]);
  });

  it("returns nothing for an empty query or when offsets cannot line up", () => {
    expect(highlightRanges("Mongolie", "")).toEqual([]);
    expect(highlightRanges("Mongolie", "xyz")).toEqual([]);
  });
});

describe("real dataset", () => {
  it("has a broadcast year for every episode", () => {
    for (const episode of episodes) {
      expect(episodeYear(episode), `episode ${episode.episode}`).not.toBeNull();
    }
  });

  it("finds episodes by country, accents ignored", () => {
    const hits = episodes.filter((e) => matchesQuery(e, "ethiopie"));
    expect(hits.length).toBeGreaterThan(1);
    expect(hits.every((e) => e.country === "Éthiopie")).toBe(true);
  });

  it("has a handful of hosts and many countries", () => {
    expect(uniqueHosts(episodes).length).toBeGreaterThanOrEqual(3);
    expect(countCountries(episodes)).toBeGreaterThan(10);
  });
});
