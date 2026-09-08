const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { X, Upload, Loader2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AdminProductForm({ product, onSave, onCancel }) {
  const { data: categoryList = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => db.entities.Category.list("name"),
  });
  const allImages = product?.image_urls?.length ? product.image_urls : (product?.image_url ? [product.image_url] : []);
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    image_url: product?.image_url || "",
    image_urls: allImages,
    category: product?.category || "sour snacks",
    stock: product?.stock ?? 0,
    is_active: product?.is_active ?? true,
    is_limited: product?.is_limited ?? false,
    variants: product?.variants || [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variantUploading, setVariantUploading] = useState(false);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("");

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setForm((prev) => ({
      ...prev,
      image_urls: [...(prev.image_urls || []), ...urls],
      image_url: prev.image_url || urls[0],
    }));
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm(prev => {
      const newUrls = prev.image_urls.filter((_, i) => i !== idx);
      return { ...prev, image_urls: newUrls, image_url: newUrls[0] || "" };
    });
  };

  const handleAddVariant = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !newVariantLabel.trim()) return;
    setVariantUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), { label: newVariantLabel.trim(), image_url: file_url, stock: parseInt(newVariantStock) || 0 }],
    }));
    setNewVariantLabel("");
    setNewVariantStock("");
    setVariantUploading(false);
    e.target.value = "";
  };

  const removeVariant = (idx) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  };

  const updateVariantStock = (idx, stock) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === idx ? { ...v, stock: parseInt(stock) || 0 } : v)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      image_url: form.image_urls?.[0] || form.image_url || "",
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Product Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Handcrafted Leather Bag"
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Price (SAR)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="0.00"
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryList.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Stock Quantity</Label>
          <Input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe your product..."
          className="rounded-xl min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Product Images (upload multiple)</Label>
        <div className="flex flex-wrap gap-2">
          {(form.image_urls || []).map((url, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0.5 right-0.5 bg-white/90 rounded-full p-0.5 hover:bg-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-stone-400 transition-colors">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5 text-stone-400 mb-1" />
                <span className="text-xs text-stone-400">Add Photos</span>
              </>
            )}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Choices (e.g. colors, sizes — each with its own photo)</Label>
        <div className="flex flex-wrap gap-2">
          {(form.variants || []).map((v, idx) => (
            <div key={idx} className="relative w-24 rounded-xl overflow-hidden border border-stone-200">
              <img src={v.image_url} alt={v.label} className="w-full h-24 object-cover" />
              <button
                type="button"
                onClick={() => removeVariant(idx)}
                className="absolute top-0.5 right-0.5 bg-white/90 rounded-full p-0.5 hover:bg-white"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-xs text-center py-1 truncate px-1 bg-stone-50">{v.label}</p>
              <Input
                type="number"
                min="0"
                value={v.stock ?? 0}
                onChange={(e) => updateVariantStock(idx, e.target.value)}
                className="rounded-none border-0 border-t border-stone-200 h-7 text-xs text-center"
                title="Stock for this option"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Input
            value={newVariantLabel}
            onChange={(e) => setNewVariantLabel(e.target.value)}
            placeholder="Choice name e.g. Red"
            className="rounded-xl h-10 max-w-[160px]"
          />
          <Input
            type="number"
            min="0"
            value={newVariantStock}
            onChange={(e) => setNewVariantStock(e.target.value)}
            placeholder="Stock"
            className="rounded-xl h-10 max-w-[90px]"
          />
          <label className={`flex items-center gap-1.5 px-3 h-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            newVariantLabel.trim() ? "border-stone-300 hover:border-stone-400" : "border-stone-100 text-stone-300 pointer-events-none"
          }`}>
            {variantUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="text-xs">Add Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleAddVariant} disabled={!newVariantLabel.trim()} />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.is_active}
          onCheckedChange={(v) => setForm({ ...form, is_active: v })}
        />
        <Label>Active (visible to customers)</Label>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.is_limited ?? false}
          onCheckedChange={(v) => setForm({ ...form, is_limited: v })}
        />
        <Label>✨ Limited Edition (rainbow glow)</Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="bg-stone-900 hover:bg-stone-800 rounded-xl px-6"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? "Update Product" : "Add Product"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancel
        </Button>
      </div>
    </form>
  );
}