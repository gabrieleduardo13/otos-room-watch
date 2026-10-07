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
- Persist air-conditioning rooms as an array under localStorage key `otos_ac_schedule_v1`, with 2026 base fields and optional per-year schedules; year-aware storage prevents four-month rollover from marking a past month.
