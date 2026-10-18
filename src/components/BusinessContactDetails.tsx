import { Clock, MessageCircle, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const phoneNumber = "+968 7502 9949";
const phoneLink = "tel:+96875029949";
const whatsappLink = "https://wa.me/96875029949";

export function BusinessContactDetails({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const details = [
    { Icon: Phone, title: t("contact.phone"), text: phoneNumber, href: phoneLink },
    {
      Icon: MessageCircle,
      title: t("contact.whatsapp"),
      text: phoneNumber,
      href: whatsappLink,
    },
    { Icon: Clock, title: t("contact.hours"), text: t("contact.hoursValue") },
  ];

  return (
    <dl className={cn("grid", compact ? "gap-4" : "gap-6", className)}>
      {details.map(({ Icon, title, text, href }) => (
        <div
          key={title}
          className={cn(
            "flex min-w-0 items-start",
            compact ? "gap-3" : "gap-4 rounded-3xl border border-border p-6",
          )}
        >
          <div
            className={cn(
              "grid shrink-0 place-items-center text-primary",
              compact ? "pt-0.5" : "h-12 w-12 rounded-full bg-primary/10",
            )}
          >
            <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <dt
              className={cn(
                "mb-1 text-muted-foreground",
                compact ? "text-xs" : "text-xs uppercase tracking-[0.2em]",
              )}
            >
              {title}
            </dt>
            <dd
              className={cn(
                "leading-relaxed [overflow-wrap:anywhere]",
                compact ? "text-sm" : "font-display text-lg",
              )}
            >
              {href ? (
                <a
                  href={href}
                  dir="ltr"
                  className="inline-block max-w-full rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  target={href === whatsappLink ? "_blank" : undefined}
                  rel={href === whatsappLink ? "noopener noreferrer" : undefined}
                >
                  {text}
                </a>
              ) : (
                text
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
