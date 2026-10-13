<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep all air-conditioning data and behavior in its independent route module; this isolates the requested addition from existing pages.
- Persist air-conditioning rooms in the `ac_schedule` table (base-year fields plus `anos` jsonb for other years), reloaded via Realtime; shared storage keeps every device in sync.
- Keep the existing `consultorios`, `historico`, `estoque_itens`, and `estoque_movimentacoes` tables as the canonical stores; duplicate replacement tables would split live clinic data.
- Mount one global Realtime subscription in the root for clinic and inventory query invalidation, including reconnect refreshes; this keeps all views current without per-page subscription leaks.
