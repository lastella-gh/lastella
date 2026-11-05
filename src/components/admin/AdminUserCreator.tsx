import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { adminCreateUserSchema } from "@/lib/admin-users";
import { createAdminUserFn } from "@/lib/admin-users.functions";

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:border-primary sm:text-sm";

export function AdminUserCreator({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (email: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    const result = adminCreateUserSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    setSaving(true);
    try {
      const created = await createAdminUserFn({ data: result.data });
      if (created.setupComplete) {
        toast.success("User created");
      } else {
        toast.error(
          "The account was created, but some details could not be saved. Open Edit to finish setup.",
        );
      }
      onCreated(result.data.email);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create the user. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormDialog
      title="Create User"
      description="Create an account that can sign in immediately."
      onSubmit={create}
      onClose={() => {
        if (!saving) onClose();
      }}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-rose-deep disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create User"}
          </button>
        </>
      }
    >
      <fieldset disabled={saving} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="create-user-name" className="block text-sm font-medium">
            Full name
          </label>
          <input
            id="create-user-name"
            name="fullName"
            autoComplete="name"
            required
            maxLength={200}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="create-user-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="create-user-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="create-user-phone" className="block text-sm font-medium">
            Phone (optional)
          </label>
          <input
            id="create-user-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="create-user-role" className="block text-sm font-medium">
            Role
          </label>
          <select id="create-user-role" name="role" defaultValue="customer" className={inputClass}>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="create-user-password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="create-user-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            aria-describedby="create-user-password-help"
            className={inputClass}
          />
          <p id="create-user-password-help" className="text-xs text-muted-foreground">
            Use at least 8 characters.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="create-user-confirm-password" className="block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="create-user-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            className={inputClass}
          />
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {error}
        </p>
      )}
    </AdminFormDialog>
  );
}
