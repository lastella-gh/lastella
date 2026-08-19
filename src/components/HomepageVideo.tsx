import { useStoreSettings } from "@/lib/settings";

export function HomepageVideo() {
  const { data: settings } = useStoreSettings();
  if (!settings?.video_enabled || !settings.video_url) return null;

  return (
    <section className="relative h-[62dvh] min-h-[420px] w-full overflow-hidden bg-foreground sm:h-[70dvh] lg:h-[80dvh]">
      <video
        className="h-full w-full object-cover"
        src={settings.video_url}
        poster={settings.video_poster_url ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Lastella collection video"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
    </section>
  );
}
