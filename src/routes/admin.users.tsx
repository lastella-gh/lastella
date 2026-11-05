import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AdminUserEditor } from "@/components/admin/AdminUserEditor";
import { AdminUserCreator } from "@/components/admin/AdminUserCreator";
import { ADMIN_USERS_PAGE_SIZE as PAGE_SIZE, type AdminUserProfile } from "@/lib/admin-users";
import { loadAdminUsersFn } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<AdminUserProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-users", user?.id, search.trim(), page],
    queryFn: ({ signal }) => loadAdminUsersFn({ data: { search: search.trim(), page }, signal }),
    enabled: !!user && isAdmin,
    retry: 1,
  });
  const users = data?.users ?? [];
  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function updateSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  function roleBadge(role: (typeof users)[number]["role"]) {
    return (
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
      >
        {role === "admin" ? "Admin" : role === "customer" ? "Customer" : "Not assigned"}
      </span>
    );
  }

  function editButton(profile: AdminUserProfile) {
    return (
      <button
        onClick={() => setEditing(profile)}
        aria-label={`Edit ${profile.full_name || "user"}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary"
      >
        <Pencil className="h-4 w-4" /> Edit
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-3xl">Users</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage registered users, account roles, and passwords.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-rose-deep sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Create User
        </button>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          aria-label="Search users by name, email, or phone"
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          placeholder="Search users by name, email, or phone..."
          maxLength={254}
          className="w-full rounded-full border border-border bg-background/50 py-2.5 pl-10 pr-10 text-base backdrop-blur transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
        />
        {search && (
          <button
            onClick={() => updateSearch("")}
            className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="glass overflow-hidden rounded-2xl" aria-busy={isFetching}>
        {isPending ? (
          <p className="p-10 text-center text-muted-foreground" role="status">
            Loading users…
          </p>
        ) : isError ? (
          <div className="space-y-3 p-6 text-center" role="alert">
            <p className="text-sm text-destructive">Failed to load users. Please try again.</p>
            <button
              onClick={() => void refetch()}
              disabled={isFetching}
              className="min-h-11 rounded-full border border-border px-5 text-sm hover:bg-secondary disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground" role="status">
            {search.trim() ? `No users matching "${search.trim()}".` : "No registered users yet."}
          </p>
        ) : (
          <>
            <ul className="grid gap-3 p-3 sm:grid-cols-2 md:hidden" aria-label="Users">
              {users.map((profile) => (
                <li
                  key={profile.id}
                  className="min-w-0 rounded-xl border border-border/60 bg-background/60 p-4"
                >
                  <p className="break-words font-medium">
                    {profile.full_name || "Name not provided"}
                  </p>
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {profile.email || "Email not provided"}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {profile.id}
                  </p>
                  <p className="mt-3 text-sm">{profile.phone || "Phone not provided"}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    {roleBadge(profile.role)}
                    <span className="text-xs text-muted-foreground">
                      Joined {new Date(profile.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-border/60 pt-2">
                    {editButton(profile)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="p-4 text-start">
                      Name
                    </th>
                    <th scope="col" className="p-4 text-start">
                      Email
                    </th>
                    <th scope="col" className="p-4 text-start">
                      Phone
                    </th>
                    <th scope="col" className="p-4 text-start">
                      Role
                    </th>
                    <th scope="col" className="p-4 text-start">
                      Joined
                    </th>
                    <th scope="col" className="p-4 text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((profile) => (
                    <tr
                      key={profile.id}
                      className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                    >
                      <td className="max-w-xs break-words p-4">
                        <p className="font-medium">{profile.full_name || "Name not provided"}</p>
                        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                          {profile.id}
                        </p>
                      </td>
                      <td className="max-w-xs break-all p-4">{profile.email || "—"}</td>
                      <td className="p-4">{profile.phone || "—"}</td>
                      <td className="p-4">{roleBadge(profile.role)}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-4 text-end">{editButton(profile)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!isPending && !isError && count > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground" role="status">
            {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + users.length} of {count} users
          </p>
          {pageCount > 1 && (
            <nav className="flex items-center gap-3" aria-label="Users pagination">
              <button
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0 || isFetching}
                aria-label="Previous page"
                className="grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-secondary disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Page {page + 1} of {pageCount}
              </span>
              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={page + 1 >= pageCount || isFetching}
                aria-label="Next page"
                className="grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-secondary disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </div>
      )}
      {editing && user && (
        <AdminUserEditor
          profile={editing}
          currentUserId={user.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          }}
        />
      )}
      {creating && (
        <AdminUserCreator
          onClose={() => setCreating(false)}
          onCreated={(email) => {
            setCreating(false);
            updateSearch(email);
            void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          }}
        />
      )}
    </div>
  );
}
