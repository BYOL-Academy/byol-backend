import express from "express";
import apiHealthRoute from "./api_health.js";
import { RouteAssembly } from "@/utils/route-assembly.util.js";

const healthRouter = express.Router();
healthRouter.use("/status", apiHealthRoute);

RouteAssembly.registerRoute(healthRouter);

// router.use('/status', apiHealthRoute)
// export default router
