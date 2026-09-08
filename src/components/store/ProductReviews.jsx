const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/Input";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-stone-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customer_name: "", comment: "", rating: 0 });

  const loadReviews = async () => {
    const data = await db.entities.Review.filter({ product_id: productId }, "-created_date");
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    if (productId) loadReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) { toast.error("Please select a star rating"); return; }
    if (!form.customer_name.trim()) { toast.error("Please enter your name"); return; }
    if (!form.comment.trim()) { toast.error("Please write a review comment"); return; }
    setSubmitting(true);
    await db.entities.Review.create({
      product_id: productId,
      customer_name: form.customer_name,
      comment: form.comment,
      rating: form.rating,
    });
    toast.success("Review submitted!");
    setForm({ customer_name: "", comment: "", rating: 0 });
    await loadReviews();
    setSubmitting(false);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mt-16 border-t border-stone-200 pt-12">
      <h2 className="text-2xl font-bold text-stone-900 mb-2">Customer Reviews</h2>
      {avgRating && (
        <div className="flex items-center gap-2 mb-6">
          <StarRating value={Math.round(avgRating)} readonly />
          <span className="text-stone-600 font-medium">{avgRating} out of 5</span>
          <span className="text-stone-400 text-sm">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
        </div>
      )}

      {/* Review Form */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-8">
        <h3 className="font-semibold text-stone-800 mb-4">Leave a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-stone-500 mb-1 block">Your Rating</label>
            <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          </div>
          <Input
            placeholder="Your name"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="rounded-xl"
          />
          <Textarea
            placeholder="Share your thoughts about this product..."
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="rounded-xl resize-none h-24"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Review
          </Button>
        </form>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-stone-400 text-center py-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-stone-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-stone-800">{review.customer_name || "Anonymous"}</p>
                  <p className="text-xs text-stone-400">{new Date(review.created_date).toLocaleDateString()}</p>
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              {review.comment && <p className="text-stone-600 text-sm leading-relaxed">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}