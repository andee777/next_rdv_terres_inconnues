import { EpisodeMap } from "@/components/episode-map/episode-map";
import { episodes } from "@/data/episodes";

export default function Home() {
  return (
    <main className="h-dvh w-full">
      <EpisodeMap episodes={episodes} />
    </main>
  );
}
