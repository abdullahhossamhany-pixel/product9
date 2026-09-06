const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import ProfileSection from "@/components/account/ProfileSection";
import AddressBookSection from "@/components/account/AddressBookSection";
import SavedCardsSection from "@/components/account/SavedCardsSection";
import WalletSection from "@/components/account/WalletSection";
import NotificationsSection from "@/components/account/NotificationsSection";
import SecuritySection from "@/components/account/SecuritySection";
import LibrarySection from "@/components/account/LibrarySection";
import { toast } from "sonner";

export default function Account() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["customer-profile", user?.email],
    queryFn: () => db.entities.CustomerProfile.filter({ customer_email: user.email }),
    enabled: !!user?.email,
  });
  const profile = profiles[0];

  const saveProfile = async (patch) => {
    try {
      if (profile) {
        await db.entities.CustomerProfile.update(profile.id, patch);
      } else {
        await db.entities.CustomerProfile.create({ customer_email: user.email, ...patch });
      }
      queryClient.invalidateQueries({ queryKey: ["customer-profile", user?.email] });
      toast.success("Saved");
    } catch {
      toast.error("Could not save");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-6">Account</h1>
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-stone-100 p-1 rounded-xl mb-6">
              {["profile", "wallet", "addresses", "cards", "notifications", "security", "library"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="capitalize rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="profile"><ProfileSection user={user} profile={profile || {}} onSave={saveProfile} /></TabsContent>
            <TabsContent value="wallet"><WalletSection user={user} /></TabsContent>
            <TabsContent value="addresses"><AddressBookSection profile={profile || {}} onSave={saveProfile} /></TabsContent>
            <TabsContent value="cards"><SavedCardsSection profile={profile || {}} onSave={saveProfile} /></TabsContent>
            <TabsContent value="notifications"><NotificationsSection profile={profile || {}} onSave={saveProfile} /></TabsContent>
            <TabsContent value="security"><SecuritySection user={user} /></TabsContent>
            <TabsContent value="library"><LibrarySection /></TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}