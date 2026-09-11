import { createRootRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RouterLink = ({ name, to }: { name: string; to: string }) => {
  return (
    <Link to={to} className="[&.active]:font-bold [&.active]:bg-gray-100 p-2 rounded-md">
      {name}
    </Link>
  );
};

const SearchInput = () => {
  const router = useRouter();

  const handlerEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void router.navigate({ to: "/search", search: { q: e.currentTarget.value } });
    }
  };

  return (
    <div className="flex items-center">
      <input
        className="w-64 h-8 rounded-md border border-gray-200 px-2"
        placeholder="搜索"
        onKeyDown={handlerEnter}
      />
    </div>
  );
};

const RootLayout = () => (
  <>
    <div className="h-svh w-svw flex flex-col">
      <div className="flex h-12 border-b border-gray-200 shadow-sm shrink-0 justify-between">
        <div className="flex gap-2 h-full">
          <RouterLink name="Home" to="/" />
          <RouterLink name="about" to="/about" />
          <RouterLink name="播放器" to="/player" />
        </div>
        <div className="h-full flex items-center">
          <SearchInput />
        </div>
        <div className="h-full flex items-center px-2">- 口 x</div>
      </div>
      {/* 内容区 */}
      <div className="flex-1  contain-size overflow-auto">
        <Outlet />
      </div>
    </div>
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
