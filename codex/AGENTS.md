# Relentless DECS Workflow

1. Before architecture-affecting work, call `decs_get_context`.
2. Draft decisions with: title, what, why, purpose, constraints.
3. Ask explicit confirmation before `decs_create` or `decs_update`.
4. If a key decision is contradicted, explain it and ask whether to supersede.
5. If `.decs.json` is missing, run DECS init flow first.
