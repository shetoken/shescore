import { useState } from "react";
import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/design/PageHero";
import { pageByKey, SITE } from "@/config/manifest";
import { BlueTick } from "@/components/design/Badges";
import { Check } from "lucide-react";

const ENDPOINT = import.meta.env.VITE_REGISTER_ENDPOINT as string | undefined;

export default function Register() {
  const meta = pageByKey("Register")!;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ org: "", type: "Government", country: "", email: "", message: "", consent: false });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, list: "registrants" };
    if (ENDPOINT) {
      try { await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch { /* fall through */ }
      setSent(true);
    } else {
      // No backend configured — open a prefilled email and confirm.
      const body = encodeURIComponent(`Organisation: ${form.org}\nType: ${form.type}\nCountry: ${form.country}\nEmail: ${form.email}\n\n${form.message}`);
      window.location.href = `mailto:contact@shescore.org?subject=${encodeURIComponent("Data-verification registration")}&body=${body}`;
      setSent(true);
    }
  }

  const input = "w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Layout>
      <SEO title={meta.title} description={meta.description} url={`${SITE.origin}/register`} />
      <PageHero
        eyebrow="For governments &amp; NGOs"
        title="Register a data-verification programme"
        lead="Verified government and NGO programmes get a verified profile and quarterly score updates from verified data."
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BlueTick label="Verified profile" /> + quarterly updates
        </div>
      </PageHero>

      <div className="container max-w-3xl py-12 grid md:grid-cols-[1fr_1.2fr] gap-10 items-start">
        <div className="space-y-4 text-sm text-foreground/80">
          <h2 className="text-xl">What you get</h2>
          <ul className="space-y-2">
            {["A verified profile (Blue Tick) on your country/region page",
              "Quarterly score updates instead of annual",
              "A direct channel to submit verified indicator data",
              "Public, documented treatment of your submissions"].map((t) => (
              <li key={t} className="flex gap-2"><Check className="h-4 w-4 text-pillar-economic shrink-0 mt-0.5" />{t}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            This programme is about data verification only. We never claim nonprofit or tax-exempt status, and we don't
            offer financial instruments here.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-semibold text-pillar-economic"><Check className="h-5 w-5" /> Thank you</div>
            <p className="mt-2 text-sm text-foreground/80">
              We've received your interest. We'll be in touch at the email you provided. For anything urgent, reach us at{" "}
              <a href="mailto:contact@shescore.org" className="text-magenta-ink hover:underline">contact@shescore.org</a>.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Organisation name</label>
              <input required className={input} value={form.org} onChange={(e) => set("org", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className={input} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option>Government</option><option>NGO / Nonprofit</option><option>Statistical agency</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country / region</label>
                <input required className={input} value={form.country} onChange={(e) => set("country", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact email</label>
              <input required type="email" className={input} value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea rows={3} className={input} value={form.message} onChange={(e) => set("message", e.target.value)} />
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5" />
              I agree to be contacted about this registration. See the{" "}
              <a href="/privacy" className="text-magenta-ink hover:underline">privacy policy</a>.
            </label>
            <button type="submit" disabled={!form.consent}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-smooth disabled:opacity-40">
              Submit interest
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
