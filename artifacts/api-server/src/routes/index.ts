import { Router, type IRouter } from "express";
import healthRouter from "./health";
import notesRouter from "./notes";
import payrollRouter from "./payroll";
import openaiRouter from "./openai-proxy";
import geminiRouter from "./gemini-proxy";
import deepseekRouter from "./deepseek-proxy";
import googleTokenRouter from "./google-token";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/notes", notesRouter);
router.use("/payroll", payrollRouter);
router.use("/openai", openaiRouter);
router.use("/gemini", geminiRouter);
router.use("/deepseek", deepseekRouter);
router.use("/google/token", googleTokenRouter);

export default router;
