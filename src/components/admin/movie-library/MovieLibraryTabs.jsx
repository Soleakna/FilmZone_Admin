import { useMemo } from "react";
import { Film, Clapperboard, Tv } from "lucide-react";
import { PANELS } from "../../../pages/admin/movieLibraryPanels";

export default function MovieLibraryTabs({
  activeGroupTab,
  setActiveGroupTab,
  activePanelId,
  onSelectPanel,
}) {
  const groupPanels = useMemo(() => {
    return PANELS.filter((p) => p.group === activeGroupTab);
  }, [activeGroupTab]);

  return (
    <div className="space-y-4">
      {/* Top Group Switcher */}
      <div className="bg-white rounded-3xl p-3 border border-neutral-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Group 1: Cinema Catalog */}
          <button
            onClick={() => {
              setActiveGroupTab("MANAGED");
              onSelectPanel("MANAGED");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeGroupTab === "MANAGED"
                ? "bg-[#b90101] text-white shadow-xs"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Cinema Catalog</span>
          </button>

          {/* Group 2: TMDB Movies */}
          <button
            onClick={() => {
              setActiveGroupTab("MOVIES");
              onSelectPanel("TMDB_UPCOMING");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeGroupTab === "MOVIES"
                ? "bg-[#b90101] text-white shadow-xs"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>TMDB Live Movies</span>
          </button>

          {/* Group 3: TMDB TV */}
          <button
            onClick={() => {
              setActiveGroupTab("TV");
              onSelectPanel("TMDB_TRENDING_TV");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeGroupTab === "TV"
                ? "bg-[#b90101] text-white shadow-xs"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>TMDB TV Series</span>
          </button>
        </div>

        {/* <div className="text-[11px] font-bold text-neutral-400 px-3">
          Category: <span className="text-neutral-800">{activeGroupTab}</span>
        </div> */}
      </div>

      {/* Panel Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {groupPanels.map((p) => {
          const Icon = p.icon;
          const isActive = activePanelId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPanel(p.id)}
              className={`flex flex-col text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                isActive
                  ? "bg-[#b90101] text-white border-[#b90101] shadow-md scale-[1.02]"
                  : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`p-2 rounded-xl ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#b90101]/10 text-[#b90101]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {p.mediaType}
                </span>
              </div>
              <span className="font-bold text-xs leading-tight line-clamp-1">
                {p.label}
              </span>
              <span
                className={`text-[10px] mt-0.5 ${
                  isActive ? "text-white/80" : "text-neutral-400"
                }`}
              >
                {p.subLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
