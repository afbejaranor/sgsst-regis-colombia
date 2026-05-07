import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import EmpresaDetail from "./pages/EmpresaDetail";
import Examenes from "./pages/Examenes";
import Matrices from "./pages/Matrices";
import Actas from "./pages/Actas";
import Pila from "./pages/Pila";
import Comites from "./pages/Comites";
import PlanAccion from "./pages/PlanAccion";
import NuevaEmpresa from "./pages/NuevaEmpresa";
import Login from "./pages/Login";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

export function AppRouter() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <Redirect to={user ? "/dashboard" : "/login"} />} />
      <Route path="/dashboard">
        <RequireAuth><Dashboard /></RequireAuth>
      </Route>
      <Route path="/empresa/nueva">
        {() => <RequireAuth><NuevaEmpresa /></RequireAuth>}
      </Route>
      <Route path="/empresa/:id">
        {(params) => <RequireAuth><EmpresaDetail /></RequireAuth>}
      </Route>
      <Route path="/empresa/:id/examenes">
        {() => <RequireAuth><Examenes /></RequireAuth>}
      </Route>
      <Route path="/empresa/:id/matrices">
        {() => <RequireAuth><Matrices /></RequireAuth>}
      </Route>
      <Route path="/empresa/:id/actas">
        {() => <RequireAuth><Actas /></RequireAuth>}
      </Route>
      <Route path="/empresa/:id/pila">
        {() => <RequireAuth><Pila /></RequireAuth>}
      </Route>
      <Route path="/empresa/:id/comites">
        {() => <RequireAuth><Comites /></RequireAuth>}
      </Route>
      <Route path="/empresa/:id/plan">
        {() => <RequireAuth><PlanAccion /></RequireAuth>}
      </Route>
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
