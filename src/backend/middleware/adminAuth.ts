import basicAuth from "express-basic-auth";

export const adminAuth = basicAuth({
  users: {
    [process.env.ADMIN_USERNAME || "admin"]:
      process.env.ADMIN_PASSWORD || "admin123",
  },
  challenge: false,
});
