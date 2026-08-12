import { createRoot } from "react-dom/client";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import App from "./App";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { trpc } from "./lib/trpc";
import "./index.css";

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${window.location.origin}/api/trpc`,
      fetch: (url, options) => fetch(url, { ...options, credentials: "include" }),
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider><App /></SupabaseAuthProvider>
    </QueryClientProvider>
  </trpc.Provider>,
);
