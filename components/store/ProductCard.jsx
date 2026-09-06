import React from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProductImageCarousel from "@/components/store/ProductImageCarousel";
import WishlistButton from "@/components/store/WishlistButton";

export default function ProductCard({ product, onAddToCart, index = 0, user }) {
  const isLimited = product.is_limited === true;
  const outOfStock = product.stock <= 0;
  const hasVariants = product.variants?.length > 0;
  const imgs = product.image_urls?.length ? product.image_urls : (product.image_url ? [product.image_url] : []);
  const wished = user ? !!(product._wished) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 10) * 0.05 }}
      whileHover={{ y: -6 }}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-500 hover:shadow-xl ${
        isLimited
          ? "border-transparent rainbow-glow"
          : "border-stone-100 hover:border-stone-200 hover:shadow-stone-200/50"
      }`}
    >
      {/* Wishlist heart */}
      {user && (
        <WishlistButton product={product} user={user} saved={wished} />
      )}

      {/* Limited Edition Badge */}
      {isLimited && (
        <div className="absolute top-3 left-0 right-0 flex justify-center z-10">
          <span className="rainbow-text font-bold text-xs uppercase tracking-widest px-3 py-1 bg-white/90 rounded-full shadow-sm">
            ✨ Limited Edition
          </span>
        </div>
      )}

      {/* Out of Stock Overlay */}
      {outOfStock && (
        <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center rounded-2xl">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            <p className="text-red-600 font-bold text-sm">No Stock</p>
            <p className="text-red-400 text-xs text-center">Restocking soon</p>
          </div>
        </div>
      )}

      <div className="aspect-[4/5] overflow-hidden bg-stone-50 relative">
        <ProductImageCarousel images={imgs} alt={product.name} />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">
              {product.category?.replace(/_/g, " ") || "Product"}
            </p>
            <h3 className={`font-semibold truncate text-lg leading-tight ${isLimited ? "rainbow-text" : "text-stone-900"}`}>
              {product.name}
            </h3>
          </div>
          <p className="text-lg font-bold text-stone-900 whitespace-nowrap">
            SAR {product.price?.toFixed(2)}
          </p>
        </div>

        {product.description && (
          <p className="text-sm text-stone-500 mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          {hasVariants ? (
            <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`} className="flex-1">
              <Button
                className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 text-sm font-medium transition-all duration-300"
                disabled={outOfStock}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                {outOfStock ? "No Stock" : "Choose Options"}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() => onAddToCart(product)}
              className="flex-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 text-sm font-medium transition-all duration-300"
              disabled={outOfStock}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              {outOfStock ? "No Stock" : "Add to Cart"}
            </Button>
          )}
          <Link to={createPageUrl("ProductDetail") + `?id=${product.id}`}>
            <Button
              variant="outline"
              className="rounded-xl h-11 w-11 p-0 border-stone-200 hover:bg-stone-50"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}