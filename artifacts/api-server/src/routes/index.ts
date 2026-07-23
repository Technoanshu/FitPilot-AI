import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fitpilotRouter from "./fitpilot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fitpilotRouter);

export default router;
