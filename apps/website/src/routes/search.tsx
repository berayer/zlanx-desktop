import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type SearchParams = {
  q?: string;
};

type MediaInfo = {
  url: string;
  name: string;
  img: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: RouteComponent,
});

const DEBOUNCE_MS = 300;

function RouteComponent() {
  const { q } = Route.useSearch();

  const [data, setData] = useState<MediaInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyword = q?.trim();

    if (!keyword) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // 防抖：快速切换关键词时只保留最后一次请求，避免重复发送
    const timer = window.setTimeout(() => {
      window.electron.ipcRenderer
        .invoke("api:search", keyword)
        .then((result: MediaInfo[]) => {
          if (cancelled) return; // 丢弃过期响应，避免竞态覆盖新数据
          setData(Array.isArray(result) ? result : []);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          console.error("搜索失败", error);
          setData([]);
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="p-4">
      {loading ? (
        <SkeletonGrid />
      ) : data.length > 0 ? (
        <>
          <p className="mb-3 text-sm text-gray-500">共 {data.length} 个结果</p>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {data.map((item, index) => (
              <MediaCard key={item.url ?? index} item={item} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState keyword={q} />
      )}
    </div>
  );
}

function MediaCard({ item }: { item: MediaInfo }) {
  return (
    <Link
      to="/player"
      search={{ url: item.url }}
      title={item.name}
      className="group block focus:outline-none"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
          暂无封面
        </div>
        {item.img && (
          <img
            src={item.img}
            alt={item.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
      </div>
      <p
        className="mt-2 line-clamp-2 text-sm text-gray-800 transition group-hover:text-gray-950"
        title={item.name}
      >
        {item.name}
      </p>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {Array.from({ length: 14 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-2/3 w-full rounded-lg bg-gray-200" />
          <div className="mt-2 h-3.5 rounded bg-gray-200" />
          <div className="mt-1.5 h-3.5 w-2/3 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ keyword }: { keyword?: string }) {
  return (
    <div className="flex h-60 flex-col items-center justify-center gap-1 text-sm text-gray-400">
      <p>{keyword ? `没有找到与「${keyword}」相关的影片` : "输入关键词开始搜索"}</p>
    </div>
  );
}
