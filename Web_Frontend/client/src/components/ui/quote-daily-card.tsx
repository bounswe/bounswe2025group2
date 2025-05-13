import { useQuery } from "@tanstack/react-query";

export function QuoteDailyCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["daily-quote"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/api/quote/");
      if (!res.ok) throw new Error("Failed to fetch quote");
      return res.json();
    },
  });

  if (isLoading) return (
    <div className="p-4 rounded-lg border bg-nav-bg border-[#800000]">
      <p className="text-sm text-[#800000]/80">Loading quote...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 rounded-lg border bg-nav-bg border-[#800000]">
      <p className="text-sm text-red-500">Failed to load quote.</p>
    </div>
  );

  return (
    <div className="p-4 rounded-lg border bg-nav-bg border-[#800000]">
      <p className="text-lg text-[#800000]">"{data.text}"</p>
      <p className="text-sm text-[#800000]/70 mt-1">— {data.author}</p>
    </div>
  );
}
