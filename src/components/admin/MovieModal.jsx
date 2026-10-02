import { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Sparkles,
  Key,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Copy,
} from "lucide-react";
import {
  searchLiveTmdb,
  fetchLiveTmdbDetails,
  getTmdbApiKey,
  setTmdbApiKey,
} from "../../services/tmdbService";
import {
  AVAILABLE_BRANCHES,
  HALL_CONFIGS,
  createDefaultBranchSchedules,
  getBaseHallsTemplate,
  getHallsForDate,
} from "../../utils/hallConfigs";
import { generateDateList } from "../../utils/dateHelpers";
import { MOCK_MOVIES } from "../../utils/mockData";
import { toast } from "react-toastify";
import { useGetHallsQuery } from "../../services/api/hallApi";
import { hideSeededDemoHalls } from "../../utils/hallVisibility";
import { useGetShowtimesQuery, useUpdateShowtimeStatusMutation } from "../../services/api/showtimeApi";

// Map an admin-created hall (Cinema API) into the schedule-hall shape used by
// the day-by-day scheduling UI (mirrors getBaseHallsTemplate entries).
const mapApiHallToScheduleHall = (apiHall, branchName) => {
  const hallType = apiHall.hallType || "STANDARD";
  const isVip = hallType.toUpperCase() === "VIP";
  return {
    id: `${apiHall.uuid}-${branchName}`,
    name: branchName,
    hallName: apiHall.name,
    hallType,
    hallCategory: hallType.toLowerCase(),
    price: isVip ? 11.0 : 5.0,
    badges: [hallType],
    times: ["10:30 AM", "01:15 PM", "04:30 PM"],
    apiHallUuid: apiHall.uuid,
    capacity: apiHall.capacity,
  };
};

const formatShowtimeTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
};

const showtimeStatusChip = (status) =>
  status === "OPEN"
    ? "bg-emerald-100 text-emerald-700"
    : status === "DRAFT"
      ? "bg-neutral-200 text-neutral-600"
      : status === "COMPLETED"
        ? "bg-sky-100 text-sky-600"
        : "bg-red-100 text-red-600";

const buildBranchesFromApiHalls = (apiHalls) =>
  AVAILABLE_BRANCHES.map((branchName, bi) => ({
    id: `branch-api-${bi + 1}`,
    branchName,
    halls: apiHalls.map((apiHall) =>
      mapApiHallToScheduleHall(apiHall, branchName),
    ),
    scheduleByDate: {},
  }));

export default function MovieModal({
  isOpen,
  onClose,
  onSave,
  editingMovie = null,
}) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("2h 25min");
  const [genres, setGenres] = useState("Superhero, Adventure, Action");
  const [status, setStatus] = useState("Live"); // 'Live' | 'Upcoming'
  const [posterPath, setPosterPath] = useState(
    "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
  );
  const [year, setYear] = useState("2026");
  const [tmdbId, setTmdbId] = useState(null);
  const [startDate, setStartDate] = useState("2026-08-25");
  const [durationPreset, setDurationPreset] = useState("7");
  const [endDate, setEndDate] = useState("2026-09-01");
  const [branches, setBranches] = useState(() =>
    createDefaultBranchSchedules(),
  );
  const [selectedBranchIdx, setSelectedBranchIdx] = useState(0);
  const [newTimeInput, setNewTimeInput] = useState({});
  const [activeDate, setActiveDate] = useState("2026-08-25");

  const { data: rawApiHalls = [] } = useGetHallsQuery();
  const apiHalls = useMemo(
    () => hideSeededDemoHalls(rawApiHalls),
    [rawApiHalls],
  );
 
  const activeApiHalls = useMemo(
    () =>
      apiHalls.filter(
        (h) => (h?.status || "ACTIVE").toUpperCase() === "ACTIVE",
      ),
    [apiHalls],
  );
  const inactiveApiHalls = useMemo(
    () =>
      apiHalls.filter(
        (h) => (h?.status || "ACTIVE").toUpperCase() !== "ACTIVE",
      ),
    [apiHalls],
  );

  const {
    data: apiShowtimes = [],
    refetch: refetchShowtimes,
  } = useGetShowtimesQuery();
  const apiShowtimesForDate = useMemo(
    () =>
      (Array.isArray(apiShowtimes) ? apiShowtimes : []).filter(
        (st) => st?.startTime?.slice(0, 10) === activeDate,
      ),
    [apiShowtimes, activeDate],
  );

  const [updateShowtimeStatus] = useUpdateShowtimeStatusMutation();
  const [publishingShowtimeUuid, setPublishingShowtimeUuid] = useState(null);

  const handlePublishShowtime = async (showtime) => {
    const uuid = showtime?.uuid;
    if (!uuid || publishingShowtimeUuid) return;
    setPublishingShowtimeUuid(uuid);
    try {
      await updateShowtimeStatus({ uuid, status: "OPEN" }).unwrap();
      toast.success(
        `"${showtime.movieTitle || "Showtime"}" published — users can now book it.`,
      );
      refetchShowtimes();
    } catch (err) {
      console.error("Publish showtime error:", err);
      toast.error(
        err?.data?.message ||
          err?.data?.error ||
          `Request failed (HTTP ${err?.status}): ${err?.error || "Check the Network tab."}`,
      );
    } finally {
      setPublishingShowtimeUuid(null);
    }
  };
  const [hydratedApiHalls, setHydratedApiHalls] = useState(false);

  const generatedDates = useMemo(() => {
    const days =
      durationPreset === "custom"
        ? Math.max(
            1,
            Math.ceil(
              Math.abs(new Date(endDate) - new Date(startDate)) /
                (1000 * 60 * 60 * 24),
            ) + 1,
          )
        : parseInt(durationPreset, 10) || 7;
    return generateDateList(
      startDate,
      days,
      durationPreset === "custom" ? endDate : null,
    );
  }, [startDate, durationPreset, endDate]);

  // Keep activeDate valid when dates change
  useEffect(() => {
    if (
      generatedDates.length > 0 &&
      !generatedDates.some((d) => d.full === activeDate)
    ) {
      setActiveDate(generatedDates[0].full);
    }
  }, [generatedDates, activeDate]);

  // TMDB Live Cloud Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKey, setCustomKey] = useState(() => getTmdbApiKey());

  useEffect(() => {
    setHydratedApiHalls(false);
    if (editingMovie) {
      setTitle(editingMovie.title || "");
      setDuration(editingMovie.duration || "2h 25min");
      setGenres(editingMovie.genres || "Action");
      setStatus(editingMovie.status || "Live");
      setPosterPath(editingMovie.poster_path || editingMovie.poster || "");
      setYear(editingMovie.year || "2026");
      setTmdbId(editingMovie.tmdbId || editingMovie.id || null);

      setStartDate(editingMovie.startDate || "2026-08-25");
      setEndDate(editingMovie.endDate || "2026-09-01");
      setDurationPreset(String(editingMovie.totalDays || "7"));

      if (
        editingMovie.branches &&
        Array.isArray(editingMovie.branches) &&
        editingMovie.branches.length > 0
      ) {
        setBranches(editingMovie.branches);
      } else {
        setBranches(createDefaultBranchSchedules());
      }
    } else {
      setTitle("");
      setDuration("2h 25min");
      setGenres("Superhero, Adventure, Action");
      setStatus("Live");
      setPosterPath(
        "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      );
      setYear("2026");
      setTmdbId(null);
      setStartDate("2026-08-25");
      setDurationPreset("7");
      setEndDate("2026-09-01");
      setSearchQuery("");
      setSearchResults([]);
      setBranches(createDefaultBranchSchedules());
      setActiveDate("2026-08-25");
    }
  }, [editingMovie, isOpen]);

  useEffect(() => {
    if (!editingMovie && !hydratedApiHalls && rawApiHalls.length > 0) {
      setBranches(buildBranchesFromApiHalls(activeApiHalls));
      setHydratedApiHalls(true);
    }
  }, [editingMovie, hydratedApiHalls, rawApiHalls, activeApiHalls]);

  const currentBranch = branches[selectedBranchIdx] || branches[0];

  const activeDayHalls = useMemo(() => {
    return getHallsForDate(currentBranch, activeDate);
  }, [currentBranch, activeDate]);

  const handlePresetChange = (daysVal) => {
    setDurationPreset(daysVal);
    if (daysVal !== "custom") {
      const days = parseInt(daysVal, 10);
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(start.getDate() + days - 1);
        const y = end.getFullYear();
        const m = String(end.getMonth() + 1).padStart(2, "0");
        const d = String(end.getDate()).padStart(2, "0");
        setEndDate(`${y}-${m}-${d}`);
      }
    }
  };

  // TMDB Live Search
  const handleTmdbSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const liveRes = await searchLiveTmdb(query.trim());
      if (liveRes.results && liveRes.results.length > 0) {
        setSearchResults(liveRes.results.slice(0, 6));
      } else {
        const localMatches = MOCK_MOVIES.filter((m) =>
          m.title.toLowerCase().includes(query.toLowerCase()),
        );
        setSearchResults(localMatches.slice(0, 6));
      }
    } catch {
      const localMatches = MOCK_MOVIES.filter((m) =>
        m.title.toLowerCase().includes(query.toLowerCase()),
      );
      setSearchResults(localMatches.slice(0, 6));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectTmdbMovie = async (sm) => {
    setTitle(sm.title);
    setTmdbId(sm.tmdbId || sm.id);
    if (sm.poster_path) setPosterPath(sm.poster_path);
    if (sm.year) setYear(sm.year);

    const details = await fetchLiveTmdbDetails(sm.tmdbId || sm.id);
    if (details) {
      if (details.duration) setDuration(details.duration);
      if (details.genres) setGenres(details.genres);
      if (details.year) setYear(details.year);
    } else if (sm.genres) {
      setGenres(
        typeof sm.genres === "string" ? sm.genres : "Action, Adventure",
      );
    }

    setSearchResults([]);
    setSearchQuery("");
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setTmdbApiKey(customKey);
    setShowKeyConfig(false);
    toast.success("TMDB API Key saved successfully!");
  };

  // Deep clone helper to ensure 100% reactive state updates
  const getClonedBranchAndSchedule = () => {
    const updatedBranches = JSON.parse(JSON.stringify(branches));
    const branch = updatedBranches[selectedBranchIdx];
    if (!branch.scheduleByDate) branch.scheduleByDate = {};
    if (!branch.scheduleByDate[activeDate]) {
      branch.scheduleByDate[activeDate] = JSON.parse(
        JSON.stringify(getHallsForDate(branch, activeDate)),
      );
    }
    return { updatedBranches, branch };
  };

  // Add Hall (Instant UI update)
  const handleAddHallToActiveDate = (value) => {
    // Admin-created hall from the Cinema API (selected by its uuid)
    const apiHall = apiHalls.find((h) => h.uuid === value);
    if (apiHall) {
      // Inactive halls can never be added to a showtime, even via the picker.
      if ((apiHall.status || "ACTIVE").toUpperCase() === "ACTIVE") {
        const { updatedBranches, branch } = getClonedBranchAndSchedule();
        const dayHalls = branch.scheduleByDate[activeDate];

        dayHalls.push(mapApiHallToScheduleHall(apiHall, branch.branchName));
        setBranches(updatedBranches);
      }
      return;
    }

    const config = HALL_CONFIGS[value];
    if (!config) return;

    const { updatedBranches, branch } = getClonedBranchAndSchedule();
    const dayHalls = branch.scheduleByDate[activeDate];

    const newHall = {
      id: `hall-${value}-${Date.now()}`,
      name: branch.branchName,
      hallName: config.name,
      hallType: config.id,
      price: config.pricing.vip || config.pricing.single,
      badges: [config.badge, "KH", "EN"],
      times: ["09:00 PM", "12:45 PM", "03:45 PM"],
    };

    dayHalls.push(newHall);
    setBranches(updatedBranches);
  };

  // Delete Hall (Instant UI update)
  const handleDeleteHallFromActiveDate = (hallIndex) => {
    const { updatedBranches, branch } = getClonedBranchAndSchedule();
    const dayHalls = branch.scheduleByDate[activeDate];

    if (dayHalls.length <= 1) {
      toast.warn("At least one hall is required for this day");
      return;
    }

    dayHalls.splice(hallIndex, 1);
    setBranches(updatedBranches);
  };

  // Add Time Slot (Instant UI update)
  const handleAddTimeSlotToActiveDate = (hallIdx) => {
    const timeVal = (newTimeInput[hallIdx] || "").trim();
    if (!timeVal) return;

    const { updatedBranches, branch } = getClonedBranchAndSchedule();
    const dayHalls = branch.scheduleByDate[activeDate];
    const hall = dayHalls[hallIdx];

    if (hall.times.includes(timeVal)) {
      toast.warn("Time slot already exists for this day");
      return;
    }

    hall.times.push(timeVal);
    setBranches(updatedBranches);
    setNewTimeInput({ ...newTimeInput, [hallIdx]: "" });
  };

  // Delete Time Slot (Instant UI update)
  const handleDeleteTimeSlotFromActiveDate = (hallIdx, timeIdx) => {
    const { updatedBranches, branch } = getClonedBranchAndSchedule();
    const dayHalls = branch.scheduleByDate[activeDate];
    const hall = dayHalls[hallIdx];

    if (hall.times.length <= 1) {
      toast.warn("At least one showtime is required for this day");
      return;
    }

    hall.times.splice(timeIdx, 1);
    setBranches(updatedBranches);
  };

  // Copy schedule across all days
  const handleCopyScheduleToAllDates = () => {
    const { updatedBranches, branch } = getClonedBranchAndSchedule();
    const currentHallsClone = JSON.parse(
      JSON.stringify(branch.scheduleByDate[activeDate]),
    );

    generatedDates.forEach((d) => {
      branch.scheduleByDate[d.full] = JSON.parse(
        JSON.stringify(currentHallsClone),
      );
    });

    branch.halls = JSON.parse(JSON.stringify(currentHallsClone));
    setBranches(updatedBranches);
    toast.success(`Copied schedule across all ${generatedDates.length} days!`);
  };

  // Add Branch
  const handleAddBranch = (branchName) => {
    if (branches.some((b) => b.branchName === branchName)) {
      toast.warn("Branch already added");
      return;
    }
    const templateHalls = getBaseHallsTemplate(branchName);
    const newBranch = {
      id: `branch-${Date.now()}`,
      branchName,
      halls: JSON.parse(JSON.stringify(templateHalls)),
      scheduleByDate: {},
    };
    setBranches([...branches, newBranch]);
    setSelectedBranchIdx(branches.length);
  };

  // Delete Branch (Instant update)
  const handleDeleteBranch = (index) => {
    if (branches.length <= 1) {
      toast.warn("At least one branch must remain");
      return;
    }
    const updated = branches.filter((_, idx) => idx !== index);
    setBranches(updated);
    setSelectedBranchIdx(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter movie title");
      return;
    }

    const calculatedDays =
      durationPreset === "custom"
        ? Math.max(
            1,
            Math.ceil(
              Math.abs(new Date(endDate) - new Date(startDate)) /
                (1000 * 60 * 60 * 24),
            ) + 1,
          )
        : parseInt(durationPreset, 10) || 7;

    const payload = {
      id: editingMovie ? editingMovie.id : Date.now(),
      tmdbId: tmdbId || Date.now(),
      title: title.trim(),
      year: year || "2026",
      duration: duration || "2h 25min",
      hall: currentBranch?.branchName || "FilmZone SenSok",
      genres: genres || "Action",
      status: status || "Live",
      poster_path:
        posterPath ||
        "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
      startDate,
      endDate,
      totalDays: calculatedDays,
      date: `${startDate} to ${endDate} (${calculatedDays} Days)`,
      branches,
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between pr-8">
          <div>
            <h3 className="text-2xl font-black text-neutral-900">
              {editingMovie
                ? "Edit Movie & Schedules"
                : "Add Movie & Schedules"}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Instant Delete & Add for Independent Day-by-Day Schedules
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="p-2 rounded-xl text-neutral-500 hover:text-[#b90101] hover:bg-neutral-100 transition"
            title="Configure TMDB API Key"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>

        {/* Optional TMDB Key Input Box */}
        {showKeyConfig && (
          <form
            onSubmit={handleSaveApiKey}
            className="p-3 bg-red-50/50 border border-red-200 rounded-2xl space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
              <span>Enter TMDB API Key / Access Token:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Paste API Key..."
                className="flex-1 px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#b90101] text-white text-xs font-bold rounded-xl"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Live TMDB Cloud Search Box */}
        {!editingMovie && (
          <div className="space-y-2 p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#b90101]" />
                <span>Search TMDB Cloud (Live Auto-Fill):</span>
              </label>
            </div>

            <div className="relative">
              {searching ? (
                <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b90101] animate-spin" />
              ) : (
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleTmdbSearch(e.target.value)}
                placeholder="Type movie name (e.g. Spider-Man, Deadpool, Gladiator II)..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#b90101]"
              />
            </div>

            {/* Live Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-neutral-100 bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                {searchResults.map((sm) => (
                  <div
                    key={sm.id}
                    onClick={() => handleSelectTmdbMovie(sm)}
                    className="p-2.5 flex items-center gap-3 hover:bg-red-50/50 cursor-pointer transition"
                  >
                    <img
                      src={sm.poster_path}
                      alt={sm.title}
                      className="w-8 h-11 object-cover rounded-md shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {sm.title}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {sm.year || sm.release_date?.slice(0, 4)} &bull; Rating:
                        ⭐ {sm.vote_average || "8.0"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#b90101] border-b border-neutral-200 pb-1">
              1. Movie Details
            </h4>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Movie Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spider-Man: Brand New Day"
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#b90101]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Release Year
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2026"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="2h 25min"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Catalog Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900"
                >
                  <option value="Live">Live (Now Showing)</option>
                  <option value="Upcoming">Upcoming (Coming Soon)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Genres
                </label>
                <input
                  type="text"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  placeholder="Superhero, Adventure, Action"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Poster Image URL
                </label>
                <input
                  type="text"
                  value={posterPath}
                  onChange={(e) => setPosterPath(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Date Scheduling */}
          <div className="space-y-3 bg-red-50/40 p-4 rounded-2xl border border-red-200/60">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#b90101] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>2. Showing Date Range</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handlePresetChange(durationPreset);
                  }}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Duration Preset
                </label>
                <select
                  value={durationPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900"
                >
                  <option value="3">3 Days</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="8">8 Days</option>
                  <option value="14">14 Days (2 Weeks)</option>
                  <option value="30">30 Days (1 Month)</option>
                  <option value="custom">Custom End Date</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  disabled={durationPreset !== "custom"}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Branches & Instant Day-by-Day Scheduler */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#b90101] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>3. Branches & Independent Day Scheduler</span>
              </h4>

              {/* Copy to All Days Button */}
              <button
                type="button"
                onClick={handleCopyScheduleToAllDates}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 hover:text-[#b90101] bg-white border border-neutral-300 px-2.5 py-1 rounded-lg shadow-2xs"
                title="Replicate this day's setup across all dates"
              >
                <Copy className="w-3 h-3" />
                <span>Copy this day&apos;s schedule to ALL days</span>
              </button>
            </div>

            {/* Branch Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {branches.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                    selectedBranchIdx === idx
                      ? "bg-[#b90101] text-white border-[#b90101] shadow-xs"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200"
                  }`}
                  onClick={() => setSelectedBranchIdx(idx)}
                >
                  <span>{b.branchName}</span>
                  {branches.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBranch(idx);
                      }}
                      className="p-0.5 hover:text-white text-white/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              <div className="relative inline-block">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddBranch(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-white border border-dashed border-neutral-400 hover:border-[#b90101] rounded-full text-xs font-bold text-neutral-600 cursor-pointer"
                >
                  <option value="">+ Add Cinema Branch</option>
                  {AVAILABLE_BRANCHES.filter(
                    (ab) => !branches.some((b) => b.branchName === ab),
                  ).map((ab) => (
                    <option key={ab} value={ab}>
                      {ab}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Picker Bar to choose which day to configure */}
            <div className="p-3 bg-neutral-100/70 rounded-2xl border border-neutral-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#b90101]" />
                  <span>Configuring Specific Schedule for Day:</span>
                </span>
                <span className="text-[11px] font-semibold text-neutral-500">
                  (Changes made below ONLY affect this selected day)
                </span>
              </div>

              {/* Date Pills Slider in Modal */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {generatedDates.map((gd) => {
                  const isActive = activeDate === gd.full;
                  return (
                    <button
                      key={gd.full}
                      type="button"
                      onClick={() => setActiveDate(gd.full)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition border ${
                        isActive
                          ? "bg-[#b90101] text-white border-[#b90101] shadow-xs"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <span>
                        {gd.month} {gd.day}
                      </span>
                      <span className="text-[10px] opacity-80 ml-1">
                        ({gd.weekday})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Day's Isolated Halls & Showtimes */}
            {currentBranch && (
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">
                    Halls Active on{" "}
                    <strong className="text-[#b90101]">{activeDate}</strong> (
                    {activeDayHalls.length} halls):
                  </span>

                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        handleAddHallToActiveDate(e.target.value);
                    }}
                    className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-[#b90101] rounded-lg text-xs font-bold text-neutral-800 shadow-2xs cursor-pointer transition"
                  >
                    <option value="">+ Add Hall to this day</option>
                    {rawApiHalls.length > 0 ? (
                      <>
                      <optgroup label="🏛️ Cinema Halls (Active)">
                        {activeApiHalls.length > 0 ? (
                          activeApiHalls.map((h) => (
                            <option key={h.uuid} value={h.uuid}>
                              {h.name} — {h.hallType} ({h.capacity} seats)
                            </option>
                          ))
                        ) : apiHalls.length > 0 ? (
                          <option value="" disabled>
                            No active halls — activate one in Manage Halls
                          </option>
                        ) : (
                          <option value="" disabled>
                            No halls created yet — add one in Manage Halls
                          </option>
                        )}
                      </optgroup>
                      {inactiveApiHalls.length > 0 && (
                        <optgroup label="⛔ Inactive Halls (Unavailable)">
                          {inactiveApiHalls.map((h) => (
                            <option key={h.uuid} value="" disabled>
                              {h.name} — {h.hallType} ({h.capacity} seats)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      </>
                    ) : (
                      <>
                        <optgroup label="🏛️ Standard Hall (Regular & Couple)">
                          <option value="standard_2d">
                            Standard Hall — 2D Screen ($5.00)
                          </option>
                          <option value="standard_3d">
                            Standard Hall — 3D RealD Laser ($6.50)
                          </option>
                          <option value="standard_screenx">
                            Standard Hall — ScreenX 270° ($8.00)
                          </option>
                        </optgroup>
                        <optgroup label="👑 VIP Lounge Hall (Motorized Recliners)">
                          <option value="vip_2d">
                            VIP Lounge Hall — 2D Recliner ($11.00)
                          </option>
                          <option value="vip_3d">
                            VIP Lounge Hall — 3D RealD VIP ($13.00)
                          </option>
                          <option value="vip_screenx">
                            VIP Lounge Hall — ScreenX VIP ($15.00)
                          </option>
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>

                {/* Real showtimes created in Cinema Showtimes, for this date */}
                {apiShowtimesForDate.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#b90101]" />
                      Cinema API Showtimes on{" "}
                      <strong className="text-[#b90101]">{activeDate}</strong>{" "}
                      ({apiShowtimesForDate.length}):
                    </p>
                    <div className="space-y-2.5">
                      {apiShowtimesForDate.map((st) => (
                        <div
                          key={st.uuid}
                          className="bg-white rounded-xl p-3 border border-emerald-200/70 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-neutral-900 truncate">
                                {st.movieTitle || "Untitled"}
                              </p>
                              <p className="text-xs font-semibold text-neutral-500 truncate mt-0.5">
                                {st.hallName || "Hall"} · Ends{" "}
                                {formatShowtimeTime(st.endTime)}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b90101]/10 text-[#b90101] text-xs font-black whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatShowtimeTime(st.startTime)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-bold">
                              Base: ${Number(st.basePrice || 0).toFixed(2)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${showtimeStatusChip(st.status)}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {st.status || "—"}
                            </span>
                            {st?.status &&
                              st.status !== "OPEN" &&
                              st.status !== "CLOSED" &&
                              st.status !== "CANCELLED" &&
                              st.status !== "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() => handlePublishShowtime(st)}
                                  disabled={publishingShowtimeUuid !== null}
                                  title="Set this showtime to OPEN so users can book it"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b90101] hover:brightness-110 text-white text-[11px] font-black transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {publishingShowtimeUuid === st?.uuid ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                  {publishingShowtimeUuid === st?.uuid
                                    ? "Publishing…"
                                    : "Publish"}
                                </button>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {activeDayHalls.map((hall, hIdx) => (
                    <div
                      key={hall.id || hIdx}
                      className="bg-white rounded-xl p-3 border border-neutral-200 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-neutral-900">
                            {hall.hallName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                            Base: ${hall.price?.toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHallFromActiveDate(hIdx)}
                          className="p-1 text-neutral-400 hover:text-[#b90101]"
                          title="Remove this hall instantly"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Time Slots for THIS day only */}
                      <div className="flex flex-wrap items-center gap-2">
                        {hall.times.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#b90101] border border-red-200 text-xs font-black"
                          >
                            <span>{t}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteTimeSlotFromActiveDate(hIdx, tIdx)
                              }
                              className="text-red-400 hover:text-red-700"
                              title="Delete this time slot instantly"
                            >
                              &times;
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="e.g. 11:30 PM"
                            value={newTimeInput[hIdx] || ""}
                            onChange={(e) =>
                              setNewTimeInput({
                                ...newTimeInput,
                                [hIdx]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTimeSlotToActiveDate(hIdx);
                              }
                            }}
                            className="w-24 px-2 py-1 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTimeSlotToActiveDate(hIdx)}
                            className="p-1 rounded-lg bg-neutral-900 text-white hover:bg-[#b90101]"
                            title="Add time slot instantly"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#b90101] hover:brightness-110 text-white font-extrabold text-xs shadow-md transition active:scale-95"
            >
              {editingMovie ? "Save Changes & Sync" : "Add Movie & Sync"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
