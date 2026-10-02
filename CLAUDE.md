@AGENTS.md

# CLAUDE.md

Everything shared across coding agents (commands, architecture, data model, gotchas, boundaries) lives in `AGENTS.md`, imported above. Keep this file for Claude Code–specific notes only, so the two don't drift.

## Working in this repo

- **Use pnpm, always.** `pnpm add`, `pnpm dlx`, `pnpm exec`; never `npm`/`npx`.
- **`node_modules` is not committed and may not be installed.** Run `pnpm install` before `lint`, `typecheck`, `test`, `build` or `dev`.
- **`data/episodes.ts` is long.** Grep for the destination or episode number and make targeted edits that match the surrounding formatting, rather than rewriting the file. Run `pnpm test` afterwards.
- **Adding shadcn components:** `pnpm dlx shadcn@latest add <name>` (the project is already initialized; `components.json` exists). Review the generated file: this project uses Base UI, so link-as-button uses `render`, not `asChild`.
- **Version-specific APIs:** Next 16.3, React 19.3, Tailwind 4, Base UI and react-leaflet 5. Look up the docs for those versions instead of relying on memory.
- **Stay in scope.** `AGENTS.md` lists known limitations. If you notice one while working, mention it in your reply; don't fix it unless it's part of the task.
- **If `components/MapWrapper.js` still exists, don't read it.** It is ~190 KB (~80k tokens) of dead pre-modernization code (it imports the uninstalled `pigeon-maps`). Tell the user it can be deleted.

## Verifying a change

1. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` for quick feedback.
2. `pnpm build` before calling the work done (needs internet for Google Fonts).
3. For anything visible, start the `dev` server with the preview tools (`.claude/launch.json` exists, and `autoPort` is on because port 3000 is often taken by another process; never kill that process) and look at the map in the built-in browser. Check that markers render, a cluster expands on click, a popup opens with its thumbnail, the close button works, and the clicked marker turns red. To see dark mode, emulate the color scheme and **reload** (next-themes reads the system preference at startup).
4. `read_console_messages` accumulates across reloads; judge a fix by what happens after the latest reload, not by old entries. Filter with `pattern` and a small `limit`, because Leaflet stack traces are huge.

## Environment notes (Windows)

- The primary shell is PowerShell and Git Bash is also available. Use `/` paths in Bash and quote Windows paths with spaces.
- Git may refuse to run with _"detected dubious ownership"_ because the folder is owned by `BUILTIN/Administrateurs`. Pass the exception per command (`git -c safe.directory='*' status`) rather than changing the user's global git config. Suggest the permanent fix (`git config --global --add safe.directory <path>`) to the user instead of running it.
- Only commit or push when asked.
- Deleting tracked files may be blocked by the permission classifier. If it is, don't look for another way around it; leave the deletion for the user and list the files.
