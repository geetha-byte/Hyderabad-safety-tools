<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Store catalogue data and admin roles in Lovable Cloud; product writes must verify the server-side admin role so browser state cannot grant privileges.
- Assign the designated store admin role only after email verification, using auth creation and confirmation triggers; this prevents unverified signups from gaining product-management privileges.
- User listing and role changes run through admin-checked database functions so they work without the server-only key (local runs); invitations use the admin API when available and fall back to a sign-in link; role rules protect the owner and caller.
- Keep optional sizes in the catalogue size array and multiple colour names comma-separated in the existing colour field; identify cart lines by product, size and colour so selections stay separate without a schema change.
- Define the storefront context and consumer hook outside the provider component module so live component updates cannot replace the context identity.
- Share category navigation through the public root layout and mobile menu, omitting the root category sidebar on the shop page to avoid duplicate navigation beside its filters; keep admin pages outside that layout so storefront restructuring does not alter admin access.
- CSV import uses a shared client-safe product schema and parser; authenticated server-side admin checks, full-file validation and one insert keep imports atomic and prevent replacing existing products.
- Quote-only products use an explicit price-on-request flag; omit numeric offers and cart purchase actions so unknown prices are never advertised as free.
- Public catalogue reads require is_published; admins retain hidden-product reads, and private image downloads require the authenticated admin role while approved storefront images use server-issued signed links.
