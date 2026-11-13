import { MutationForm } from "@/components/mutation-form";
import { getActor } from "@/modules/auth/session";
import { requireAdmin } from "@/modules/workflow/policy";
import { db } from "@/lib/db";
import { saveStaff } from "@/app/cms/actions";
export default async function Users() {
  requireAdmin(await getActor());
  const users = await db.user.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="eyebrow accent">THE PEOPLE BEHIND THE STORIES</span>
          <h1>
            Team members<span className="brand-dot">.</span>
          </h1>
          <p>
            Individual accounts. Clear responsibilities. One shared publication.
          </p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Your team</h2>
          </div>
          {users.map((u) => (
            <div className="taxonomy-row" key={u.id}>
              <div>
                <strong>{u.name}</strong>
                <small>{u.email}</small>
              </div>
              <div>
                <span className="role-label">{u.role.toLowerCase()}</span>
                <small>{u.active ? "Active" : "Inactive"}</small>
              </div>
            </div>
          ))}
        </section>
        <MutationForm
          action={saveStaff}
          className="panel panel-body form-stack"
        >
          <h2>Invite or update a member</h2>
          <label>
            Name
            <input name="name" required minLength={2} maxLength={80} />
          </label>
          <label>
            Verified GitHub email
            <input type="email" name="email" required />
          </label>
          <label>
            Author URL slug
            <input
              name="publicSlug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
          </label>
          <label>
            Role
            <select name="role">
              <option>JOURNALIST</option>
              <option>EDITOR</option>
              <option>ADMIN</option>
            </select>
          </label>
          <label>
            Status
            <select name="active">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <small>
            This grants sign-in access to the email address. Share the sign-in
            URL directly; no email is sent. Existing email addresses are
            updated.
          </small>
          <button className="button">Save team member</button>
        </MutationForm>
      </div>
    </>
  );
}
