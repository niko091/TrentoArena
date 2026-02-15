import basicAuth from "express-basic-auth";

export const statsAuth = basicAuth({
  users: {
    [process.env.STATS_USERNAME || "stats"]:
      process.env.STATS_PASSWORD || "stats123",
  },
  challenge: false,
});
