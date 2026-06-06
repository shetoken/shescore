import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PAGES } from "@/config/manifest";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

/* shescore.org router. Routes are generated from the single page manifest so the
   router, sitemap and prerenderer never drift. Task 3 swaps each Placeholder for
   its real page component (keyed by page.key). */

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 5 * 60 * 1000 } },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {PAGES.map((p) => (
              <Route key={p.path} path={p.path} element={<Placeholder page={p} />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
