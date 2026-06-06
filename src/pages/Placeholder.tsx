import { SEO } from "@/lib/seo";
import { Layout } from "@/components/Layout";
import { SITE, type PageMeta } from "@/config/manifest";

/* Generic page scaffold used by every route until Task 3 fills in real content.
   It still renders unique, crawlable copy (title + description + an h1) so no
   route is ever an empty shell — satisfying the "fully prerendered" rule. */
export default function Placeholder({ page }: { page: PageMeta }) {
  return (
    <Layout>
      <SEO title={page.title} description={page.description} url={`${SITE.origin}${page.path}`} />
      <div className="container py-16 max-w-3xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
          {page.navLabel ?? page.title}
        </h1>
        <p className="text-lg text-foreground/80">{page.description}</p>
        <p className="source-line mt-8">
          This page's full content is built in Task 3 of the shescore.org build. The route, metadata, navigation,
          sitemap entry and prerendered snapshot are already wired.
        </p>
      </div>
    </Layout>
  );
}
