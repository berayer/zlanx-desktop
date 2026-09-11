import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

type SearchParams = {
  url?: string;
};

export const Route = createFileRoute("/player")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    url: typeof search.url === "string" ? search.url : undefined,
  }),
});

/** api:detail 返回的剧集结构 */
type Episode = {
  /** 集数名称，类似「第1集」「第2集」 */
  name: string;
  /** 候选播放地址，会依次尝试直到播放成功或全部失败（都不是可直接播放的地址） */
  list: string[];
};

type PlayStatus = "idle" | "loading" | "ready" | "failed";

const FILM = {
  name: "光影之间",
  year: 2026,
  region: "中国大陆",
  genres: ["悬疑", "剧情"],
  rating: 8.7,
  description:
    "一位年迈的放映员在整理旧胶片时，发现了几段从未公映的画面。为了找出这些影像背后的真相，他回到了那座已经停业多年的老电影院，并逐渐揭开了被刻意隐藏的往事……",
};

function RouteComponent() {
  const { url } = Route.useSearch();

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(Boolean(url));

  // 当前选中的集数，以及正在尝试的候选地址序号
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const [playUrl, setPlayUrl] = useState<string>();
  const [status, setStatus] = useState<PlayStatus>("idle");

  // 1. SearchParams.url 变化时，重新获取播放列表
  useEffect(() => {
    if (!url) {
      setEpisodes([]);
      setEpisodesLoading(false);
      return;
    }

    let cancelled = false;
    setEpisodesLoading(true);
    setEpisodes([]);
    setEpisodeIndex(0);
    setCandidateIndex(0);

    window.electron.ipcRenderer
      .invoke("api:detail", url)
      .then((result: Episode[]) => {
        if (cancelled) return;
        setEpisodes(Array.isArray(result) ? result : []);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("获取播放列表失败", error);
        setEpisodes([]);
      })
      .finally(() => {
        if (cancelled) return;
        setEpisodesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // 2. 解析当前候选地址：拿到真实播放地址就播放，否则尝试下一个候选
  useEffect(() => {
    const episode = episodes[episodeIndex];

    if (!episode) {
      setPlayUrl(undefined);
      setStatus("idle");
      return;
    }

    const candidate = episode.list[candidateIndex];
    if (!candidate) {
      // 候选地址已全部尝试完，仍未找到可播放地址
      setPlayUrl(undefined);
      setStatus("failed");
      return;
    }

    let cancelled = false;
    setPlayUrl(undefined);
    setStatus("loading");

    window.electron.ipcRenderer
      .invoke("api:play", candidate)
      .then((real: string | undefined) => {
        if (cancelled) return;
        if (real) {
          setPlayUrl(real);
          setStatus("ready");
        } else {
          setCandidateIndex((i) => i + 1); // 该地址不可播放，尝试下一个
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("解析播放地址失败", error);
        setCandidateIndex((i) => i + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [episodes, episodeIndex, candidateIndex]);

  const currentEpisode = episodes[episodeIndex];

  const selectEpisode = (index: number) => {
    setEpisodeIndex(index);
    setCandidateIndex(0);
    setPlayUrl(undefined);
  };

  // 播放器区域的展示状态
  let playerState: "no-url" | "loading" | "failed" | "ready";
  if (!url) {
    playerState = "no-url";
  } else if (episodesLoading || (!episodes.length && status === "idle")) {
    playerState = "loading";
  } else if (!episodes.length) {
    playerState = "failed";
  } else if (status === "idle" || status === "loading") {
    playerState = "loading";
  } else if (status === "ready" && playUrl) {
    playerState = "ready";
  } else {
    playerState = "failed";
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      {/* 播放器：固定 16:9，黑色底，居中裁切 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/5">
        {playUrl && (
          <ReactPlayer
            key={playUrl}
            src={playUrl}
            controls
            playsInline
            width="100%"
            height="100%"
            className="h-full w-full object-contain"
            // 播放失败时继续尝试下一个候选地址
            onError={() => setCandidateIndex((i) => i + 1)}
          />
        )}
        {playerState !== "ready" && <PlayerOverlay state={playerState} />}
      </div>

      {/* 影片介绍 */}
      <section className="mt-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {FILM.name}
            {currentEpisode && (
              <span className="ml-2 text-base font-normal text-gray-500">
                {currentEpisode.name}
              </span>
            )}
          </h1>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-amber-500">{FILM.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{FILM.year}</span>
          <span>·</span>
          <span>{FILM.region}</span>
          {FILM.genres.map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {genre}
            </span>
          ))}
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600">{FILM.description}</p>
      </section>

      {/* 选集 */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-medium">选集</h2>

        {episodesLoading ? (
          <EpisodeSkeleton />
        ) : episodes.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {episodes.map((episode, index) => {
              const active = index === episodeIndex;
              return (
                <button
                  key={`${episode.name}-${index}`}
                  type="button"
                  onClick={() => selectEpisode(index)}
                  title={episode.name}
                  className={`truncate rounded-lg border px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-gray-900 bg-gray-900 font-medium text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {episode.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{url ? "暂无可用剧集" : "请从搜索结果进入播放页"}</p>
        )}
      </section>
    </div>
  );
}

function PlayerOverlay({ state }: { state: "no-url" | "loading" | "failed" }) {
  const text =
    state === "loading"
      ? "正在解析播放地址…"
      : state === "failed"
        ? "该集暂时无法播放，试试其他集数"
        : "未选择影片，请从搜索结果进入";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-sm text-gray-300">
      {state === "loading" && (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-gray-200" />
      )}
      <p>{text}</p>
    </div>
  );
}

function EpisodeSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="h-9 animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  );
}
