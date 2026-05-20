import { Router, type IRouter } from "express";
import healthRouter from "./health";
import empresasRouter from "./empresas";
import cumplimientoRouter from "./cumplimiento";
import dashboardRouter from "./dashboard";
import trabajadoresRouter from "./trabajadores";
import examenesRouter from "./examenes";
import matricesRouter from "./matrices";
import actasRouter from "./actas";
import pilaRouter from "./pila";
import comitesRouter from "./comites";
import planAccionRouter from "./plan-accion";
import documentosRouter from "./documentos";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/empresas", empresasRouter);
router.use("/cumplimiento", cumplimientoRouter);
router.use("/dashboard", dashboardRouter);
router.use("/trabajadores", trabajadoresRouter);
router.use("/examenes", examenesRouter);
router.use("/matrices", matricesRouter);
router.use("/actas", actasRouter);
router.use("/pila", pilaRouter);
router.use("/comites", comitesRouter);
router.use("/plan-accion", planAccionRouter);
router.use("/documentos", documentosRouter);

export default router;
