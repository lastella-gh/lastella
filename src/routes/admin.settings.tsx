import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type StoreSettings = Tables<"store_settings">;
type SettingsForm = Pick<
  StoreSettings,
  | "video_url"
  | "video_poster_url"
  | "video_enabled"
  | "bank_name"
  | "bank_account_name"
  | "bank_account_number"
  | "bank_instructions"
>;

const emptySettings: SettingsForm = {
  video_url: null,
  video_poster_url: null,
  video_enabled: false,
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_instructions: "",
};

function AdminSettings() {
  const [settings, setSettings] = useState<SettingsForm>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        toast.error("Failed to load store settings");
      } else {
        setSettings(data);
      }
      setLoading(false);
    }

    void loadSettings();
  }, []);

  function update<K extends keyof SettingsForm>(field: K, value: SettingsForm[K]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload: SettingsForm = {
      ...settings,
      video_url: settings.video_url?.trim() || null,
      video_poster_url: settings.video_poster_url?.trim() || null,
      bank_name: settings.bank_name.trim(),
      bank_account_name: settings.bank_account_name.trim(),
      bank_account_number: settings.bank_account_number.trim(),
      bank_instructions: settings.bank_instructions.trim(),
    };
    const { data, error } = await supabase
      .from("store_settings")
      .update(payload)
      .eq("id", 1)
      .select("id")
      .single();

    setSaving(false);
    if (error || !data) {
      toast.error("Failed to save store settings");
      return;
    }

    setSettings(payload);
    toast.success("Store settings saved");
  }

  if (loading) {
    return <div className="glass rounded-2xl p-10 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Store Settings</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage storefront video and bank transfer details
          </p>
        </div>
        <button
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep transition-all disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <section className="glass rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="font-display text-2xl">Storefront Video</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Provide hosted video and poster image URLs. Binary uploads are not supported here.
          </p>
        </div>

        <label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-secondary/10 cursor-pointer hover:bg-secondary/20">
          <input
            type="checkbox"
            checked={settings.video_enabled}
            onChange={(event) => update("video_enabled", event.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm font-medium">Enable storefront video</span>
        </label>

        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Video URL">
            <input
              type="url"
              value={settings.video_url ?? ""}
              onChange={(event) => update("video_url", event.target.value)}
              className={inputClass}
              placeholder="https://example.com/store-video.mp4"
            />
          </Field>
          <Field label="Video Poster URL">
            <input
              type="url"
              value={settings.video_poster_url ?? ""}
              onChange={(event) => update("video_poster_url", event.target.value)}
              className={inputClass}
              placeholder="https://example.com/video-poster.jpg"
            />
          </Field>
        </div>
      </section>

      <section className="glass rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="font-display text-2xl">Bank Transfer</h3>
          <p className="text-sm text-muted-foreground mt-1">
            These details are shown to customers who pay by bank transfer.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Bank Name">
            <input
              value={settings.bank_name}
              onChange={(event) => update("bank_name", event.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Account Name">
            <input
              value={settings.bank_account_name}
              onChange={(event) => update("bank_account_name", event.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Account Number">
            <input
              value={settings.bank_account_number}
              onChange={(event) => update("bank_account_number", event.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Payment Instructions">
              <textarea
                value={settings.bank_instructions}
                onChange={(event) => update("bank_instructions", event.target.value)}
                className={inputClass}
                rows={5}
                required
                placeholder="Instructions shown after checkout"
              />
            </Field>
          </div>
        </div>
      </section>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
