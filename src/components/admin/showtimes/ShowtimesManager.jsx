import { useState } from "react";
import {
  Clock,
  Eye,
  Grid3x3,
  Plus,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useShowtimesData } from "../../../pages/admin/hooks/useShowtimesData";
import { useGetHallsQuery } from "../../../services/api/hallApi";
import { useGetMoviesQuery } from "../../../services/api/movieApi";
import { hideSeededDemoHalls } from "../../../utils/hallVisibility";
import CreateShowtimeModal from "./CreateShowtimeModal";
import ShowtimeDetailsModal from "./ShowtimeDetailsModal";
import ShowtimeSeatsModal from "./ShowtimeSeatsModal";

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  } catch {
    return "—";
  }
};

const statusBadgeClass = (status) =>
  status === "DRAFT"
    ? "bg-neutral-200 text-neutral-600"
    : status === "OPEN"
      ? "bg-emerald-100 text-emerald-600"
      : status === "CLOSED"
        ? "bg-amber-100 text-amber-700"
        : status === "CANCELLED"
          ? "bg-red-100 text-red-600"
          : "bg-sky-100 text-sky-600";

const statusDotClass = (status) =>
  status === "DRAFT"
    ? "bg-neutral-500"
    : status === "OPEN"
      ? "bg-emerald-500 animate-pulse"
      : status === "CLOSED"
        ? "bg-amber-500"
        : status === "CANCELLED"
          ? "bg-red-600"
          : "bg-sky-500";

export default function ShowtimesManager() {
  const {
    showtimes,
    isListLoading,
    isListFetching,
    isListError,
    listError,
    refetchShowtimes,
    selectedShowtimeUuid,
    showtimeDetails,
    isDetailsLoading,
    isDetailsError,
    detailsError,
    refetchDetails,
    openDetails,
    closeDetails,
    seatsShowtimeUuid,
    showtimeSeats,
    isSeatsLoading,
    isSeatsError,
    seatsError,
    refetchSeats,
    openSeats,
    closeSeats,
    isCreating,
    handleCreateShowtime,
    isUpdatingStatus,
    handleUpdateShowtimeStatus,
  } = useShowtimesData();

  // Halls for the create form — the API returns every hall (including backend
  // demo seeds), so hide the same seeded halls the Manage Halls page hides.
  const { data: rawHalls = [] } = useGetHallsQuery();
  const allHalls = hideSeededDemoHalls(rawHalls);
  const { data: moviesPage } = useGetMoviesQuery({ page: 0, size: 200 });
  const movies = Array.isArray(moviesPage?.content) ? moviesPage.content : [];

  const [createOpen, setCreateOpen] = useState(false);

  const seatsShowtime = showtimes.find((s) => s.uuid === seatsShowtimeUuid);

  return (
    <div className="space-y-6 font-sans">
      {/* Hero + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs">
        <div>
          <div className="relative inline-block pb-2">
            <h2 className="text-2xl font-black text-[#b90101] tracking-tight">
              Cinema Showtimes
            </h2>
            <div className="absolute bottom-0 left-0 w-24 h-1 bg-[#b90101] rounded-full" />
          </div>
          <p className="text-xs font-semibold text-neutral-500 mt-2 max-w-xl">
            Showtimes in the Cinema Booking, schedule a movie in a
            hall, view details, and inspect seat availability.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={refetchShowtimes}
            disabled={isListFetching}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:border-[#b90101] hover:text-[#b90101] shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isListFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#b90101] hover:brightness-110 px-5 py-2.5 text-white text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Showtime
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50/50">
          <Clock className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-black text-neutral-700">
            {showtimes.length} showtime(s)
          </span>
        </div>
        {isListLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">Fetching showtimes…</span>
          </div>
        ) : isListError ? (
          <div className="py-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="mt-3 text-sm font-bold text-red-700">
              Failed to load showtimes from the Cinema Booking API.
            </p>
            <p className="text-xs font-semibold text-neutral-500 mt-1 break-all">
              {listError?.data?.message ||
                listError?.data?.error ||
                listError?.error ||
                `Server returned HTTP ${listError?.status}` ||
                "Unknown error"}
            </p>
            <button
              type="button"
              onClick={refetchShowtimes}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#b90101] text-white rounded-xl text-xs font-black hover:brightness-110 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="mt-3 text-sm font-bold text-neutral-500">
              No showtimes yet.
            </p>
            <p className="text-xs font-semibold text-neutral-400 mt-1">
              Use "Create Showtime" above to schedule a movie in a hall.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full min-w-[900px] xl:min-w-0 table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-[#b90101] text-white text-lg font-black uppercase tracking-wider sticky top-0">
                  <th className="py-3.5 px-4 w-[24%]">MOVIE</th>
                  <th className="py-3.5 px-4 w-[18%]">HALL</th>
                  <th className="py-3.5 px-4 w-[20%] whitespace-nowrap">START TIME</th>
                  <th className="py-3.5 px-4 w-[16%] whitespace-nowrap">BASE PRICE</th>
                  <th className="py-3.5 px-4 w-[10%]">STATUS</th>
                  <th className="py-3.5 px-4 w-[16%] text-center whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-semibold text-neutral-800">
                {showtimes.map((st) => (
                  <tr key={st?.uuid} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-3 sm:px-4">
                      <span
                        className="font-extrabold text-neutral-900 text-lg leading-snug truncate block"
                        title={st?.movieTitle}
                      >
                        {st?.movieTitle || "Untitled"}
                      </span>
                      <span className="text-xs font-semibold text-neutral-400 truncate block font-mono">
                        {st?.uuid ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-medium text-neutral-700 truncate">
                      {st?.hallName || "—"}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-medium text-neutral-700">
                      <span className="font-bold text-neutral-900 text-lg block truncate">
                        {formatDateTime(st?.startTime)}
                      </span>
                      <span className="text-xs font-semibold text-neutral-500 truncate block">
                        Ends {formatDateTime(st?.endTime)}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium text-neutral-700">
                      ${Number(st?.basePrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${statusBadgeClass(st?.status)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass(st?.status)}`} />
                        {st?.status || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(st?.uuid)}
                          disabled={!st?.uuid}
                          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center border border-neutral-200 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="View showtime details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSeats(st?.uuid)}
                          disabled={!st?.uuid}
                          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center border border-neutral-200 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="View seat availability"
                        >
                          <Grid3x3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateShowtimeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        movies={movies}
        halls={allHalls}
        showtimes={showtimes}
        isCreating={isCreating}
        onCreate={handleCreateShowtime}
      />

      <ShowtimeDetailsModal
        open={selectedShowtimeUuid !== null}
        showtime={showtimeDetails}
        isLoading={isDetailsLoading}
        isError={isDetailsError}
        error={detailsError}
        isUpdatingStatus={isUpdatingStatus}
        onUpdateStatus={handleUpdateShowtimeStatus}
        onRetry={refetchDetails}
        onClose={closeDetails}
      />

      <ShowtimeSeatsModal
        open={seatsShowtimeUuid !== null}
        showtimeTitle={seatsShowtime?.movieTitle}
        seats={showtimeSeats}
        isLoading={isSeatsLoading}
        isError={isSeatsError}
        error={seatsError}
        onRetry={refetchSeats}
        onClose={closeSeats}
      />
    </div>
  );
}