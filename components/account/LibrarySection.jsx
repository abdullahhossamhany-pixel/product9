import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Package, Download } from "lucide-react";

const LinkCard = ({ to, icon: Icon, title, desc }) => (
  <Link to={createPageUrl(to)} className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-3 hover:shadow-sm transition-shadow">
    <Icon className="w-5 h-5 text-stone-500 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="text-sm text-stone-500">{desc}</p>
    </div>
  </Link>
);

export default function LibrarySection() {
  return (
    <div className="space-y-4">
      <LinkCard to="Wishlist" icon={Heart} title="Wishlist" desc="Your saved products" />
      <LinkCard to="Orders" icon={Package} title="Order history" desc="Track and review past orders" />
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-3">
        <Download className="w-5 h-5 text-stone-400 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-stone-900">Downloads</p>
          <p className="text-sm text-stone-400">No downloadable items yet.</p>
        </div>
      </div>
    </div>
  );
}