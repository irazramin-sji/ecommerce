import { useInfiniteQuery } from "@tanstack/react-query";
import { listProducts, ProductFilter } from "@/lib/api/productService";

export function useProducts(filters: ProductFilter) {
  return useInfiniteQuery(
    ["products", filters],
    async ({ pageParam = 0 }) => {
      const res = await listProducts({ ...(filters || {}), page: pageParam, limit: 12 });
      return { data: res, nextPage: (res?.length ?? 0) === 12 ? pageParam + 1 : undefined };
    },
    {
      getNextPageParam: (last) => last.nextPage,
      keepPreviousData: true
    }
  );
}
