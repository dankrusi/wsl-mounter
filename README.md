# wsl-mounter

`wsl-mounter` is a small CLI for WSL that mounts a Windows subfolder into `/mnt/<name>` using `drvfs`.

This is especially useful when using Claude Code or Codex in a safe mannor: only mount the folder/project you need.

## What it does

Given a subfolder name, it mounts:

- Windows path: `<WSLMOUNT_BASE>\<subfolder>`
- WSL mount point: `/mnt/<subfolder>`

Example:

- `WSLMOUNT_BASE=C:\Users\you\Projects`
- `wslmount repo`
- Mounts `C:\Users\you\Projects\repo` to `/mnt/repo`

## Requirements

- WSL (the command exits if not running inside WSL)
- `sudo` access
- A valid Windows base path
- Node.js (to run/install the CLI)

## Tips

- Turn off automount in /etc/wsl.config

## Install

From this repository:

```bash
npm install -g https://github.com/dankrusi/wsl-mounter
```

From source:

```bash
npm install -g .
```

This exposes the command:

```bash
wslmount
```

## Usage

```bash
wslmount <subfolder-name>
```

Example:

```bash
wslmount photos
```

This runs:

1. `sudo mkdir -p /mnt/photos`
2. `sudo mount -t drvfs "<WSLMOUNT_BASE>\\photos" /mnt/photos`

## First-run setup

The CLI reads `WSLMOUNT_BASE` from your environment.

If it is not set, it will prompt you for a Windows base path (for example `C:\Users\you\Projects`) and then append this to one of:

- `~/.bashrc`
- `~/.zshrc`
- `~/.profile`

It chooses the first file that already exists (or `~/.bashrc` if none exist).

After first-time setup, restart your shell (or source the file) so `WSLMOUNT_BASE` is available in future sessions.

## Notes

- Mount point naming is fixed to `/mnt/<subfolder>`.
- The command does not currently validate whether the Windows source path exists before mounting.
- Subfolder names are treated as plain names, not absolute paths.

## Troubleshooting

- `wslmount must be run inside WSL.`: Run the command from a WSL distro shell.
- `No base path provided.`: Re-run and provide a non-empty base path, or set `WSLMOUNT_BASE` manually.
- `mount` permission errors: Ensure your user can run `sudo` commands.

## License

MIT
