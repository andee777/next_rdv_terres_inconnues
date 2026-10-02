import { EpisodeExplorer } from "@/components/explorer/episode-explorer";
import { episodes } from "@/data/episodes";

export default function Home() {
  return <EpisodeExplorer episodes={episodes} />;
}
