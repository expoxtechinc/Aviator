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
      fetch: async (url, options) => {
        const response = await fetch(url, { ...options, credentials: "include" });
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) return response;
        const responseText = await response.text();
        const message = response.status === 401
          ? "Please sign in again to use BeatBox AI."
          : response.status >= 500
            ? "BeatBox AI is temporarily unavailable. Please try again shortly."
            : responseText.includes("<!doctype html") || responseText.includes("<html")
              ? "BeatBox AI endpoint is unavailable in this deployment."
              : "BeatBox AI returned an invalid response.";
        return new Response(JSON.stringify({ error: { json: { message } } }), {
          status: response.ok ? 502 : (response.status || 502),
          headers: { "content-type": "application/json" },
        });
      },
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
