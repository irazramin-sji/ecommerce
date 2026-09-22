import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Props = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  onAdd?: () => void;
};

export const ProductCard: React.FC<Props> = ({ id, name, slug, price, image, onAdd }) => {
  return (
    <Card className="p-4">
      <Link to={`/product/${slug}`} className="block">
        <div className="h-40 bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="object-cover w-full h-full" />
          ) : (
            <div className="text-sm text-muted-foreground">No image</div>
          )}
        </div>
        <h3 className="font-medium text-sm">{name}</h3>
        <div className="mt-2 font-semibold">${price.toFixed(2)}</div>
      </Link>
      <div className="mt-3">
        <Button variant="default" size="sm" onClick={onAdd}>{onAdd ? "Add to cart" : "View"}</Button>
      </div>
    </Card>
  );
};
