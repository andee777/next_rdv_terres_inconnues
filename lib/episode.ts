/** `[latitude, longitude]`, latitude first. */
export type Coordinates = [lat: number, lng: number];

/**
 * One episode of the series. Unknown values are empty strings, never omitted.
 * Field names are French on purpose: they mirror the series' own vocabulary.
 */
export type Episode = {
  episode: number;
  /** Host of the episode. */
  animateur: string;
  /** Celebrity guest. */
  celebrite: string;
  /** People or community visited. */
  peuple: string;
  /** Place name. */
  destination: string;
  /** Free-form French date, e.g. "1er septembre 2009". */
  diffusion_date: string;
  /** Broadcaster. */
  channel: string;
  coordinates: Coordinates;
  /** YouTube watch URL. */
  link: string;
  /** Thumbnail URL; must be hosted on a domain allowed in next.config.ts. */
  thumbnail: string;
  /** Video duration, e.g. "1:29:47". */
  duration: string;
  /** View count captured when the entry was written, e.g. "109 k vues". */
  views: string;
};
