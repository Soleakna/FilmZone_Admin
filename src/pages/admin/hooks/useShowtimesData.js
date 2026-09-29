import { useState } from "react";
import { toast } from "react-toastify";
import {
  useGetShowtimesQuery,
  useCreateShowtimeMutation,
  useGetShowtimeByUuidQuery,
  useGetShowtimeSeatsQuery,
} from "../../../services/api/showtimeApi";

const extractErrorMessage = (err) => {
  if (err?.status === 401 || err?.status === 403) {
    return "Unauthorized — your session token was rejected. Log out and log in again, then retry.";
  }

  const data = err?.data;
  const message =
    typeof data === "string"
      ? data
      : data?.message ||
        data?.error ||
        data?.detail ||
        err?.error ||
        "Request failed. Check the Network tab for details.";

  const rawBody =
    err?.status >= 500 && data
      ? ` — ${typeof data === "string" ? data : JSON.stringify(data)}`
      : "";

  return err?.status
    ? `Request failed (HTTP ${err.status}): ${message}${rawBody}`
    : message;
};

export function useShowtimesData() {
  // ---- List GET /showtimes ----
  const {
    data: showtimes = [],
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
    error: listError,
    refetch: refetchShowtimes,
  } = useGetShowtimesQuery();

  // ---- Details GET /showtimes/{uuid} ----
  const [selectedShowtimeUuid, setSelectedShowtimeUuid] = useState(null);
  const {
    data: showtimeDetails,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
    refetch: refetchDetails,
  } = useGetShowtimeByUuidQuery(selectedShowtimeUuid, {
    skip: !selectedShowtimeUuid,
  });

  // ---- Seats GET /showtimes/{uuid}/seats ----
  const [seatsShowtimeUuid, setSeatsShowtimeUuid] = useState(null);
  const {
    data: showtimeSeats,
    isLoading: isSeatsLoading,
    isError: isSeatsError,
    error: seatsError,
    refetch: refetchSeats,
  } = useGetShowtimeSeatsQuery(seatsShowtimeUuid, {
    skip: !seatsShowtimeUuid,
  });

  const [createShowtime, { isLoading: isCreating }] =
    useCreateShowtimeMutation();

  // Validate + POST /showtimes. Input is the request-shaped payload:
  // { movieUuid, hallUuid, showDate, showTime, basePrice }.
  const handleCreateShowtime = async (data) => {
    if (!data?.movieUuid) {
      toast.error("Please select a movie.");
      return false;
    }
    if (!data?.hallUuid) {
      toast.error("Please select a hall.");
      return false;
    }
    if (!data?.showDate) {
      toast.error("Please choose a show date.");
      return false;
    }
    if (!data?.showTime) {
      toast.error("Please choose a show time.");
      return false;
    }
    const basePrice = Number(data.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0.01) {
      toast.error("Base price must be at least 0.01.");
      return false;
    }

    try {
      await createShowtime({
        movieUuid: data.movieUuid,
        hallUuid: data.hallUuid,
        showDate: data.showDate,
        showTime: data.showTime,
        basePrice,
      }).unwrap();
      toast.success("Showtime created!");
      return true;
    } catch (err) {
      console.error("Create showtime error:", err);
      toast.error(extractErrorMessage(err));
      return false;
    }
  };

  return {
    // list
    showtimes: Array.isArray(showtimes) ? showtimes : [],
    isListLoading,
    isListFetching,
    isListError,
    listError,
    refetchShowtimes,
    // details
    selectedShowtimeUuid,
    showtimeDetails,
    isDetailsLoading,
    isDetailsError,
    detailsError,
    refetchDetails,
    openDetails: (uuid) => setSelectedShowtimeUuid(uuid),
    closeDetails: () => setSelectedShowtimeUuid(null),
    // seats
    seatsShowtimeUuid,
    showtimeSeats: Array.isArray(showtimeSeats) ? showtimeSeats : [],
    isSeatsLoading,
    isSeatsError,
    seatsError,
    refetchSeats,
    openSeats: (uuid) => setSeatsShowtimeUuid(uuid),
    closeSeats: () => setSeatsShowtimeUuid(null),
    // create
    isCreating,
    handleCreateShowtime,
  };
}