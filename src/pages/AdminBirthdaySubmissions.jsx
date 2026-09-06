const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Cake, Loader2, Eye, ShieldOff } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminBirthdaySubmissions() {
  const [user, setUser] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { db.auth.me().then(setUser).catch(() => {}); }, []);
  const isAdmin = user?.role === "admin";

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-birthday-submissions"],
    queryFn: () => db.entities.BirthdaySubmission.list("-created_date"),
    enabled: !!isAdmin,
  });

  const decide = async (row, status) => {
    try {
      // Decision clears the stored ID card image so IDs are never kept after review.
      await db.entities.BirthdaySubmission.update(row.id, { status, id_card_url: null });
      toast.success(`Submission ${status} — ID image removed`);
      qc.invalidateQueries({ queryKey: ["admin-birthday-submissions"] });
    } catch { toast.error("Could not update"); }
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-stone-500">Admins only</div>;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-1 flex items-center gap-2"><Cake className="w-7 h-7 text-pink-500" /> Birthday Verifications</h1>
        <p className="text-stone-500 mb-6 flex items-center gap-1 text-sm"><ShieldOff className="w-4 h-4" /> View the customer's ID to verify, then approve or reject — the ID image is deleted automatically on decision.</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-stone-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center text-stone-400">No birthday submissions yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-900">{r.customer_name || r.customer_email}</p>
                  <p className="text-sm text-stone-500">{r.customer_email}</p>
                  <p className="text-sm text-stone-600 mt-1">Birthday: <b>{r.birth_date}</b></p>
                  <p className="text-xs text-stone-400 mt-0.5">ID card: {r.id_card_url ? "available for review" : "cleared"}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${STATUS_STYLE[r.status]} border-0`}>{r.status}</Badge>
                  {r.id_card_url && (
                    <Button size="sm" variant="outline" onClick={() => setPreviewing(r.id_card_url)} className="rounded-lg">
                      <Eye className="w-4 h-4 mr-1" /> View ID
                    </Button>
                  )}
                  {r.status === "pending" && (
                    <React.Fragment>
                      <Button size="sm" onClick={() => decide(r, "verified")} className="rounded-lg bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Verify
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => decide(r, "rejected")} className="rounded-lg">
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </React.Fragment>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {previewing && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setPreviewing(null)}>
            <img src={previewing} alt="ID card" className="max-w-full max-h-[90vh] rounded-2xl border border-stone-200" />
          </div>
        )}
      </div>
    </div>
  );
}