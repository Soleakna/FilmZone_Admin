/**
 * Hall visibility helpers.
 *
 * The public GET /halls endpoint of the Cinema Booking API returns EVERY hall
 * in the environment (there is no "only my halls" / owner scoping yet). The
 * backend DB is also provisioned with demo/seed halls that the admin did NOT
 * create. These helpers hide those known seeds so the admin only sees the
 * halls they actually created.
 *
 * NOTE: Frontend-only stopgap. Remove once the backend supports owner scoping
 * (e.g. GET /halls?createdByMe=true or an `ownerUuid` field on halls).
 */
export const SEEDED_DEMO_HALL_UUIDS = new Set([
  "f6fd87c4-59ca-4a42-be2d-3045e876da93", // Demo seed — Hall 1 - ScreenX
  "38d63328-e780-4d73-90b9-53f612b19979", // Demo seed — Hall 2 - Standard
  "488aa8ff-64b6-4a54-a57d-6c49e944ca87", // Demo seed — Hall 3 - Screen 3D
  "96b015d4-426f-4f68-a7da-373ae9f3fded", // Demo seed — Hall 4 - Gold Class VIP
]);

export const getHallId = (hall) =>
  hall?.uuid ?? hall?.id ?? hall?._id ?? hall?.hallId;

export const isSeededDemoHall = (hall) =>
  SEEDED_DEMO_HALL_UUIDS.has(getHallId(hall));

export const hideSeededDemoHalls = (halls) =>
  (halls || []).filter((hall) => !isSeededDemoHall(hall));