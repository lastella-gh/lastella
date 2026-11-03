import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminUserDetailsSchema,
  adminUserPasswordSchema,
  type AdminUserProfile,
} from "@/lib/admin-users";
import { updateAdminUserDetailsFn, updateAdminUserPasswordFn } from "@/lib/admin-users.functions";

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:border-primary sm:text-sm";

export function AdminUserEditor({
  profile,
  currentUserId,
  onClose,
  onSaved,
}: {
  profile: AdminUserProfile;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState("details");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [role, setRole] = useState(profile.role ?? "customer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isOwnAccount = profile.id === currentUserId;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");

    const result =
      tab === "details"
        ? adminUserDetailsSchema.safeParse({ userId: profile.id, fullName, phone, role })
        : adminUserPasswordSchema.safeParse({ userId: profile.id, password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }

    setSaving(true);
    try {
      if ("fullName" in result.data) {
        await updateAdminUserDetailsFn({ data: result.data });
        toast.success("User details updated");
      } else {
        await updateAdminUserPasswordFn({ data: result.data });
        setPassword("");
        setConfirmPassword("");
        toast.success("Password updated");
      }
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save changes. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFormDialog
      title="Edit User"
      description={profile.full_name || "Manage user details, role, and password."}
      onSubmit={save}
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
            {saving ? "Saving..." : tab === "details" ? "Save changes" : "Update password"}
          </button>
        </>
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setError("");
        }}
      >
        <TabsList className="mb-5 h-auto w-full" aria-label="User settings">
          <TabsTrigger value="details" disabled={saving} className="min-h-11 flex-1">
            Account details
          </TabsTrigger>
          <TabsTrigger value="password" disabled={saving} className="min-h-11 flex-1">
            Password
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <fieldset disabled={saving} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="admin-user-name" className="block text-sm font-medium">
                Full name
              </label>
              <input
                id="admin-user-name"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                maxLength={200}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-user-phone" className="block text-sm font-medium">
                Phone
              </label>
              <input
                id="admin-user-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={40}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-user-role" className="block text-sm font-medium">
                Role
              </label>
              <select
                id="admin-user-role"
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value as typeof role)}
                disabled={isOwnAccount}
                aria-describedby={isOwnAccount ? "admin-user-role-help" : undefined}
                className={`${inputClass} disabled:opacity-60`}
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
              {isOwnAccount && (
                <p id="admin-user-role-help" className="text-xs text-muted-foreground">
                  You cannot remove your own admin role.
                </p>
              )}
            </div>
          </fieldset>
        </TabsContent>
        <TabsContent value="password">
          <fieldset disabled={saving} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Set a new password for this user. Existing passwords cannot be viewed.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="admin-user-password" className="block text-sm font-medium">
                New password
              </label>
              <input
                id="admin-user-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
                aria-describedby="admin-user-password-help"
                className={inputClass}
              />
              <p id="admin-user-password-help" className="text-xs text-muted-foreground">
                Use at least 8 characters.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-user-confirm-password" className="block text-sm font-medium">
                Confirm new password
              </label>
              <input
                id="admin-user-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
                className={inputClass}
              />
            </div>
          </fieldset>
        </TabsContent>
      </Tabs>
      {error && (
        <p role="alert" className="mt-5 text-sm text-destructive">
          {error}
        </p>
      )}
    </AdminFormDialog>
  );
}
