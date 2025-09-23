import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/theme/ThemeContext";
import { API_BASE_URL} from "@/lib/queryClient.ts";

export function FoodLogger() {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState([]);
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE_URL}/api/parse_food/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setFoods(data.foods || []);
  };

  return (
    <section className="mt-8">
      <h2 className={cn(
        "text-xl font-semibold mb-4",
        theme === "dark" ? "text-[#e18d58]" : "text-[#800000]"
      )}>
        Nutrition Analyzer
      </h2>
      <form onSubmit={handleSubmit} className="mb-4 flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 2 eggs and a banana"
          className={cn(
            "flex-1 px-4 py-2 rounded border",
            theme === "dark" ? "bg-black text-white border-[#e18d58]" : "border-[#800000]"
          )}
        />
        <button
          type="submit"
          className={cn(
            "px-4 py-2 rounded border font-medium",
            theme === "dark"
              ? "bg-[#e18d58] text-black border-[#e18d58] hover:bg-[#e18d58]/90"
              : "bg-[#800000] text-white border-[#800000] hover:bg-[#800000]/90"
          )}
        >
          Analyze
        </button>
      </form>

      {foods.length > 0 && (
        <ul className="space-y-2">
          {foods.map((food: any, index) => (
            <li key={index} className={cn(
              "p-3 rounded border",
              theme === "dark" ? "border-[#e18d58] text-white" : "border-[#800000] text-[#800000]"
            )}>
              <strong>{food.food_name}</strong> – {food.nf_calories} cal, {food.nf_protein}g protein
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
