import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import CategoryPage from "@/pages/CategoryPage";
import ProductPage from "@/pages/ProductPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import ContactPage from "@/pages/ContactPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import BlogFeedPage from "@/pages/BlogFeedPage";
import BlogPostPage from "@/pages/BlogPostPage";
import StaticContentPage from "@/pages/StaticContentPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/product/:slug" element={<ProductPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/contact-us" element={<ContactPage />} />
      <Route path="/order-success" element={<OrderSuccessPage />} />
      <Route path="/blog" element={<BlogFeedPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/pages/:slug" element={<StaticContentPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
