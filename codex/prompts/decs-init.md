Initialize Relentless DECS for this repository.

Arguments: `<project-node-id> [project-name]`

1. Validate project node id.
2. Call `decs_init_space`.
3. Ask for confirmation to write `.decs.json`.
4. Call `decs_write_repo_config`.
5. Offer bootstrap key decision via `decs_create`.
