const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminProductForm from "@/components/admin/AdminProductForm";
import AdminCategoryManager from "@/components/admin/AdminCategoryManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, ShoppingBag, Loader2, Package, EyeOff, Archive, ArchiveRestore,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await db.auth.me();
        if (user.role !== "admin") {
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => db.entities.Product.list("-created_date"),
    enabled: isAdmin === true,
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setShowForm(false);
      toast.success("Product created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setShowForm(false);
      setEditing(null);
      toast.success("Product updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => db.entities.Product.update(id, { is_active }),
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(is_active ? "Product restored" : "Product archived");
    },
  });

  const handleSave = async (data) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <EyeOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Access Denied</h2>
        <p className="text-stone-500 text-center">Only administrators can manage products.</p>
        <Button
          onClick={() => navigate(createPageUrl("Store"))}
          variant="outline"
          className="rounded-xl mt-2"
        >
          Go to Store
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Products</h1>
            <p className="text-stone-500 mt-1">{products.length} products</p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="bg-stone-900 hover:bg-stone-800 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        <AdminCategoryManager />

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              !showArchived ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Active ({products.filter(p => p.is_active !== false).length})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showArchived ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Archived ({products.filter(p => p.is_active === false).length})
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-stone-100 p-6 mb-8 shadow-sm"
            >
              <h2 className="text-lg font-semibold mb-4">
                {editing ? "Edit Product" : "New Product"}
              </h2>
              <AdminProductForm
                product={editing}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          </div>
        ) : products.filter(p => (showArchived ? p.is_active === false : p.is_active !== false)).length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 text-lg">{showArchived ? "No archived products" : "No products yet"}</p>
            {!showArchived && <p className="text-stone-400 text-sm mt-1">Add your first product to get started</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {products.filter(p => (showArchived ? p.is_active === false : p.is_active !== false)).map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-50 flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-stone-900 truncate">{product.name}</h3>
                    {product.is_active === false && (
                      <Badge variant="outline" className="text-stone-400 border-stone-200 text-xs">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-semibold text-stone-900">SAR {product.price?.toFixed(2)}</span>
                    <span className="text-sm text-stone-400">Stock: {product.stock ?? 0}</span>
                    <Badge variant="outline" className="text-xs text-stone-500 border-stone-200">
                      {product.category || "other"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg text-stone-400 hover:text-stone-700"
                    onClick={() => {
                      setEditing(product);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-lg text-stone-400 ${product.is_active === false ? "hover:text-emerald-600" : "hover:text-amber-600"}`}
                    onClick={() => archiveMutation.mutate({ id: product.id, is_active: product.is_active === false })}
                    title={product.is_active === false ? "Restore product" : "Archive product"}
                  >
                    {product.is_active === false ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg text-stone-400 hover:text-red-500"
                    onClick={() => {
                      if (confirm("Delete this product?")) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}