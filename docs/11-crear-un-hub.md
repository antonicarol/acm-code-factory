# Create a hub

A **hub** is a project's folder for the factory: its repos, its configuration, its context and its specs. There is one engine; hubs, one per project. By the end of this page you will have one with your repos inside.

## 1. Create it

```sh
factory hub-init ~/projects/my-hub
```

```text
hub my-hub ready in /Users/you/projects/my-hub (OpenSpec store: my-hub)
```

It copies the template (each folder has a `README.md` explaining what goes inside), registers the folder as an OpenSpec *store*, links `CLAUDE.md` → `AGENTS.md` and runs `git init`. A second argument changes the store id: `factory hub-init <folder> <store>`.

## 2. Add the repos

Each repo stays where it is, with its own git; the hub only links it:

```sh
cd ~/projects/my-hub
ln -s ../../code/web web
ln -s ../../code/api api
printf 'web\napi\n' >> .gitignore
```

## 3. Tell the factory what each repo is

Edit `AGENTS.md`: its repo table is what the orchestrator reads to decide which repo a task goes to.

```markdown
| Repo | What it is | Stack | Base branch · branches | Docs |
|---|---|---|---|---|
| `web` | The app customers use | Nuxt | `main` · `feat/<slug>` | `web/AGENTS.md` |
| `api` | API and database | NestJS | `main` · `feat/<slug>` | `api/README.md` |
```

And the "Where a task goes" section, in plain sentences: "screens and copy → `web`; endpoints and data → `api`".

Anything that helps the agents understand the product goes in `context/`: `product.md`, `architecture.md`, `glossary.md`. You don't need it complete to start.

## 4. Default hub (optional)

Herdr keys run outside any folder, so they use the default hub:

```sh
echo ~/projects/my-hub > ~/.config/factory/hub
```

## Check

From the hub folder, `factory` no longer errors: it lists the commands and the agents.

Next: configure `workspace.json`.
