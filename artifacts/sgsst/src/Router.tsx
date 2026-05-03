import { Switch, Route, Redirect } from "wouter";
import Dashboard from "./pages/Dashboard";
import EmpresaDetail from "./pages/EmpresaDetail";
import Examenes from "./pages/Examenes";
import Matrices from "./pages/Matrices";
import Actas from "./pages/Actas";
import Pila from "./pages/Pila";
import Comites from "./pages/Comites";
import PlanAccion from "./pages/PlanAccion";

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/empresa/:id" component={EmpresaDetail} />
      <Route path="/empresa/:id/examenes" component={Examenes} />
      <Route path="/empresa/:id/matrices" component={Matrices} />
      <Route path="/empresa/:id/actas" component={Actas} />
      <Route path="/empresa/:id/pila" component={Pila} />
      <Route path="/empresa/:id/comites" component={Comites} />
      <Route path="/empresa/:id/plan" component={PlanAccion} />
      <Route>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">404</h1>
            <p className="mt-2 text-sm text-muted-foreground">Página no encontrada</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}
