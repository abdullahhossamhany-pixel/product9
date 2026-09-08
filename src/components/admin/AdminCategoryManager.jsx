const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Tag, ArchiveRestore, Archive } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategoryManager() {
  const [newCategory, setNewCategory] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => db.entities.Category.list("name"),
  });

  const activeCategories = categories.filter((c) => c.is_active !== false);
  const archivedCategories = categories.filter((c) => c.is_active === false);

  const createMutation = useMutation({
    mutationFn: (name) => db.entities.Category.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category added");
      setNewCategory("");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => db.entities.Category.update(id, { is_active }),
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ["categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(is_active ? "Category restored" : "Category archived");
    },
  });

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newCategory.trim().toLowerCase();
    if (!trimmed) return;
    if (categories.some((c) => c.name === trimmed)) {
      toast.error("Category already exists");
      return;
    }
    createMutation.mutate(trimmed);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-stone-500" />
          <h2 className="text-lg font-semibold text-stone-900">Manage Categories</h2>
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
        >
          <Archive className="w-3.5 h-3.5" />
          {showArchived ? "Hide" : "Show"} Archived ({archivedCategories.length})
        </button>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <Input
          placeholder="New category name..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-xl"
        />
        <Button
          type="submit"
          disabled={createMutation.isPending || !newCategory.trim()}
          className="bg-stone-900 hover:bg-stone-800 rounded-xl shrink-0"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Plus className="w-4 h-4 mr-1" /> Add</>
          )}
        </Button>
      </form>

      {isLoading ? (
        <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
      ) : (
        <>
          {!showArchived && (
            activeCategories.length === 0 ? (
              <p className="text-stone-400 text-sm">No categories yet. Add one above.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeCategories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="outline"
                    className="flex items-center gap-1.5 pr-1.5 py-1 rounded-full text-sm border-stone-200 text-stone-700"
                  >
                    {cat.name}
                    <button
                      onClick={() => archiveMutation.mutate({ id: cat.id, is_active: false })}
                      className="hover:text-amber-600 transition-colors ml-0.5"
                      title="Archive category"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )
          )}

          {showArchived && (
            archivedCategories.length === 0 ? (
              <p className="text-stone-400 text-sm">No archived categories.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {archivedCategories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="outline"
                    className="flex items-center gap-1.5 pr-1.5 py-1 rounded-full text-sm border-stone-200 text-stone-400 bg-stone-50"
                  >
                    {cat.name}
                    <button
                      onClick={() => archiveMutation.mutate({ id: cat.id, is_active: true })}
                      className="hover:text-emerald-600 transition-colors ml-0.5"
                      title="Restore category"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}