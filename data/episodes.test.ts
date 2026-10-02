import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";
import { episodes } from "./episodes";

describe("episodes data", () => {
  it("is not empty", () => {
    expect(episodes.length).toBeGreaterThan(0);
  });

  it("has unique, positive integer episode numbers", () => {
    const numbers = episodes.map((e) => e.episode);
    expect(numbers.every((n) => Number.isInteger(n) && n > 0)).toBe(true);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("names the country and the host of every episode", () => {
    for (const { episode, country, animateur } of episodes) {
      expect(country.trim(), `episode ${episode} country`).not.toBe("");
      expect(animateur.trim(), `episode ${episode} host`).not.toBe("");
    }
  });

  it("has coordinates ordered [lat, lng] and within range", () => {
    for (const { episode, coordinates } of episodes) {
      const [lat, lng] = coordinates;
      expect(Math.abs(lat), `episode ${episode} latitude`).toBeLessThanOrEqual(
        90,
      );
      expect(Math.abs(lng), `episode ${episode} longitude`).toBeLessThanOrEqual(
        180,
      );
    }
  });

  it("uses YouTube watch URLs for links", () => {
    for (const { episode, link } of episodes.filter((e) => e.link)) {
      expect(link, `episode ${episode}`).toMatch(
        /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/,
      );
    }
  });

  it("only uses thumbnail hosts allowed in next.config.ts", () => {
    const allowedHosts = (nextConfig.images?.remotePatterns ?? []).map(
      (pattern) => ("hostname" in pattern ? pattern.hostname : undefined),
    );
    for (const { episode, thumbnail } of episodes.filter((e) => e.thumbnail)) {
      expect(allowedHosts, `episode ${episode}`).toContain(
        new URL(thumbnail).hostname,
      );
    }
  });
});
