"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Toaster from "./Toaster";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // البيانات تفضل "طازة" لمدة دقيقة قبل ما تتطلب تاني تلقائي
          },
        },
      })
  );

  
  return <QueryClientProvider client={queryClient}>{children}
  <Toaster />
  </QueryClientProvider>;
}