import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PAGES } from "@/config/manifest";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Methodology from "./pages/Methodology";
import Scores from "./pages/Scores";
import CountryProfile from "./pages/CountryProfile";
import Explorer from "./pages/Explorer";
import Compare from "./pages/Compare";
import About from "./pages/About";
import Governance from "./pages/Governance";
import Privacy from "./pages/Privacy";
import Data from "./pages/Data";
import Register from "./pages/Register";
import Landscape from "./pages/Landscape";
import Lab from "./pages/Lab";
import Safety from "./pages/Safety";
import Clock from "./pages/Clock";
import Reports from "./pages/Reports";

/* shescore.org router. Routes come from the single page manifest. Each page key
   maps to its real component as it's built; unbuilt keys fall back to Placeholder. */

import type { ComponentType } from "react";
const PAGE_COMPONENTS: Record<string, ComponentType> = {
  Home, Methodology, Scores, Explorer, About, Governance, Privacy, Data, Register, Landscape, Lab, Compare, Safety, Clock, Reports,
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 5 * 60 * 1000 } },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Routes>
            {PAGES.map((p) => {
              const C = PAGE_COMPONENTS[p.key];
              return <Route key={p.path} path={p.path} element={C ? <C /> : <Placeholder page={p} />} />;
            })}
            <Route path="/scores/:iso" element={<CountryProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
