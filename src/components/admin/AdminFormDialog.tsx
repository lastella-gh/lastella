import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { FormEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminFormDialog({
  title,
  description,
  onSubmit,
  onClose,
  children,
  footer,
  className,
}: {
  title: string;
  description: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm" />
        <Dialog.Content
          dir="ltr"
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            "fixed inset-0 z-[101] flex h-dvh w-full flex-col overflow-hidden border border-border/60 bg-background shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
            className,
          )}
        >
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/50 p-4 sm:p-6">
              <div className="min-w-0">
                <Dialog.Title className="font-display text-2xl">{title}</Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  {description}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-secondary/80"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {children}
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/50 bg-secondary/10 p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-5">
              {footer}
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
