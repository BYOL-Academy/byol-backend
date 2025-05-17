import express from "express";
const router = express.Router(); // create a router instance
import os from "os"; // Node.js os module

router.get("/health", async (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  // Convert uptime from seconds to a more readable format
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  // Convert memory from bytes to megabytes and round to two decimal places
  for (const key in memoryUsage) {
    const typedKey = key as keyof NodeJS.MemoryUsage;
    memoryUsage[typedKey] =
      Math.round((memoryUsage[typedKey] / (1024 * 1024)) * 100) / 100;
  }

  // Calculate CPU load
  const loadAvgPercentages = [];
  for (const loadavg of os.loadavg()) {
    loadAvgPercentages.push(Math.round((loadavg / os.cpus().length) * 100));
  }

  const data = {
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    message: "Online",
    date: new Date(),
    version: process.version,
    platform: process.platform,
    arch: process.arch,
    memory_usage_MB: memoryUsage,
    cpu_usage_percent: `${loadAvgPercentages[0]}%`,
    port: process.env.PORT || "default",
  };

  try {
    res.status(200).json({
      success: true,
      result: data ?? null,
    });
  } catch (error) {
    data.message = "Offline";
    res.status(503).send(error);
  }
});

export default router;
