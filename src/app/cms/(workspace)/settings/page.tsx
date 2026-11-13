import { MutationForm } from "@/components/mutation-form";
import { getActor } from "@/modules/auth/session";
import { requireAdmin } from "@/modules/workflow/policy";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "@/app/cms/actions";
export default async function Settings() {
  requireAdmin(await getActor());
  const s = await getSettings();
  return (
    <>
      <div className="cms-page-heading">
        <div>
          <span className="eyebrow accent">MAKE IT YOUR PUBLICATION</span>
          <h1>
            Publication settings<span className="brand-dot">.</span>
          </h1>
          <p>
            One newsroom. One identity. A consistent experience for your
            readers.
          </p>
        </div>
      </div>
      <MutationForm
        action={saveSettings}
        className="panel panel-body form-stack settings-form"
      >
        <h2>Publication details</h2>
        <label>
          Name
          <input value="The Current" readOnly />
        </label>
        <label>
          Edition tagline
          <textarea
            name="description"
            defaultValue={s.description}
            required
            minLength={10}
            maxLength={300}
          />
        </label>
        <label>
          Publisher timezone
          <input
            name="timezone"
            defaultValue={s.timezone}
            placeholder="Asia/Jakarta"
            required
          />
        </label>
        <small>
          Edition dates follow this timezone. Scheduled publication times are
          stored in UTC.
        </small>
        <button className="button">Save settings</button>
      </MutationForm>
    </>
  );
}
