import cron from "node-cron";
import sequelize from "../db/models";

cron.schedule("*/10 * * * *", async () => {
  try {
    await sequelize.query("SELECT 1");

    console.log(`[${new Date().toISOString()}] Aiven MySQL connection OK`);
  } catch (error: any) {
    console.error("Aiven MySQL keep-alive failed:", error.message);
  }
});
