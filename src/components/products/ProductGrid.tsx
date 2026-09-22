import React from "react";
import { ProductCard } from "./ProductCard";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  product_images?: { url: string }[];
};

type Props = {
  products: Product[];
  onAdd?: (p: Product) => void;
};

export const ProductGrid: React.FC<Props> = ({ products, onAdd }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          id={p.id}
          name={p.name}
          slug={p.slug}
          price={Number(p.price)}
          image={p.product_images?.[0]?.url ?? null}
          onAdd={onAdd ? () => onAdd(p) : undefined}
        />
      ))}
    </div>
  );
};
