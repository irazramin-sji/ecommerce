import React from "react";
import { useSearchParams } from "react-router-dom";

export const ProductFilters: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  function setParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  }

  return (
    <aside className="w-full md:w-64 p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Search</label>
        <input
          type="text"
          className="input"
          defaultValue={searchParams.get("search") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("search", (e.target as HTMLInputElement).value || undefined);
            }
          }}
          placeholder="Search products..."
          aria-label="Search products"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Material</label>
        <select
          className="input"
          defaultValue={searchParams.get("material") ?? ""}
          onChange={(e) => setParam("material", e.target.value || undefined)}
        >
          <option value="">Any</option>
          <option value="Stainless Steel">Stainless Steel</option>
          <option value="Titanium">Titanium</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Shape</label>
        <select
          className="input"
          defaultValue={searchParams.get("shape") ?? ""}
          onChange={(e) => setParam("shape", e.target.value || undefined)}
        >
          <option value="">Any</option>
          <option value="Curved">Curved</option>
          <option value="Straight">Straight</option>
        </select>
      </div>

      <div>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setSearchParams({});
          }}
        >
          Reset filters
        </button>
      </div>
    </aside>
  );
};
