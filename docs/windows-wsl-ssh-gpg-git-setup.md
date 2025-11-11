# Windows + WSL SSH, GPG, and Git Setup

This guide describes the streamlined developer setup we use on Windows with WSL for consistent SSH auth, commit signing (GPG), and Git behavior across CLI and GUI clients.

The core approach:

- Single OpenSSH client and agent: Windows' built-in OpenSSH and `ssh-agent` service.
- One SSH key, many clients: all tools (Git CLI, VS Code, GitHub Desktop, GitKraken, Visual Studio, WSL) share the same agent and keys.
- Commit signing via GPG on both Windows and WSL with long-lived caching and a GUI prompt in WSL.

Paths below use `<YourUser>` as a placeholder for your Windows account name.

---

## Prerequisites

- Windows 11 with OpenSSH Client and `ssh-agent` enabled (built-in).
- Git for Windows (no custom `GIT_SSH` required).
- Gpg4win installed on Windows.
- WSL with Ubuntu 24.04 (or similar), with `socat` installed.
- `npiperelay.exe` installed on Windows (e.g., via winget) at:
  `C:\\Users\\<YourUser>\\AppData\\Local\\Microsoft\\WinGet\\Links\\npiperelay.exe`

Optional (for GUI pinentry under WSL):

- `pinentry-qt` installed in the WSL distro: `sudo apt install pinentry-qt`.

---

## Core Configuration (Windows)

- OpenSSH client and agent
  - System default SSH: `C:\\Windows\\System32\\OpenSSH\\ssh.exe`.
  - Agent: Windows `ssh-agent` service set to Automatic.
  - Global `~/.ssh/config`:

    ```text
    Host *
      IdentityAgent "\\\\.\\pipe\\openssh-ssh-agent"
    ```

  - Keys: `C:\\Users\\<YourUser>\\.ssh\\id_ed25519` (+ `.pub`).
  - Load key once per logon in PowerShell profile (`C:\\Users\\<YourUser>\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1`):

    ```powershell
    if (-not (ssh-add -l 2>$null)) {
        ssh-add "$Env:UserProfile\\.ssh\\id_ed25519" | Out-Null
    }
    ```

- Git (global)
  - Uses system SSH (no `core.sshCommand` override).
  - Recommended config:

    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "you@example.com"
    git config --global gpg.format openpgp
    git config --global gpg.program gpg
    git config --global commit.gpgsign true
    ```

- GPG (Windows, Gpg4win)
  - File: `C:\\Users\\<YourUser>\\AppData\\Roaming\\gnupg\\gpg-agent.conf`

    ```text
    default-cache-ttl 28800
    max-cache-ttl 86400
    pinentry-program "C:/Program Files (x86)/GnuPG/bin/pinentry-basic.exe"
    ```

  - Reload:

    ```powershell
    gpgconf --kill gpg-agent
    ```

---

## Core Configuration (WSL / Ubuntu)

- Reuse the Windows SSH key and agent
  - Symlink SSH directory (already present):

    ```bash
    ln -s /mnt/c/Users/<YourUser>/.ssh ~/.ssh
    chmod 600 ~/.ssh/id_ed25519 ~/.ssh/config
    ```

  - Bridge the Windows agent into WSL with `socat` + `npiperelay`.
  - Helper script: `~/.config/shell/ssh-agent-bridge.sh`

    ```bash
    #!/usr/bin/env bash
    NPIPERELAY='/mnt/c/Users/<YourUser>/AppData/Local/Microsoft/WinGet/Links/npiperelay.exe'
    WIN_SSH_PIPE='//./pipe/openssh-ssh-agent'
    export SSH_AUTH_SOCK="$HOME/.ssh/agent.sock"
    if [ ! -x "$NPIPERELAY" ] || ! command -v socat >/dev/null 2>&1 || ! command -v ss >/dev/null 2>&1; then
      return 0 2>/dev/null || true
    fi
    if ! ss -a 2>/dev/null | grep -Fq "$SSH_AUTH_SOCK"; then
      rm -f "$SSH_AUTH_SOCK"
      ( setsid socat UNIX-LISTEN:"$SSH_AUTH_SOCK",fork EXEC:"$NPIPERELAY -ei -s $WIN_SSH_PIPE" >/dev/null 2>&1 & )
    fi
    ```

  - Source from shells:
    - Bash: `~/.bashrc` tail block

      ```bash
      # Bridge Windows OpenSSH agent into WSL
      if [ -f "$HOME/.config/shell/ssh-agent-bridge.sh" ]; then
        . "$HOME/.config/shell/ssh-agent-bridge.sh"
      fi
      ```

    - Zsh: `~/.zshrc` tail block

      ```zsh
      # Bridge Windows OpenSSH agent into WSL
      if [ -f "$HOME/.config/shell/ssh-agent-bridge.sh" ]; then
        . "$HOME/.config/shell/ssh-agent-bridge.sh"
      fi
      ```

  - Verify from WSL:

    ```bash
    ssh-add -l    # shows the same ED25519 keys as Windows
    ssh -T git@github.com
    ```

- GPG (WSL)
  - File: `~/.gnupg/gpg-agent.conf`

    ```text
    default-cache-ttl 28800
    max-cache-ttl 86400
    pinentry-program /usr/bin/pinentry-qt
    ```

  - Permissions and reload:

    ```bash
    chmod 600 ~/.gnupg/gpg-agent.conf
    gpgconf --kill gpg-agent
    ```

  - Test signing from WSL (first use shows GUI pinentry):

    ```bash
    gpg --clearsign README.md
    ```

---

## Daily Use

- Windows shells and GUI tools (VS Code, GitHub Desktop, GitKraken, Visual Studio) all reuse the Windows `ssh-agent`; you enter your SSH key passphrase once per logon.
- WSL shells reuse the same agent via the bridge; `ssh-add -l` in WSL shows the same keys.
- GPG commit signing prompts once per session window (8h default cache) on both Windows and WSL.

---

## Optional UX Tweaks

- Disable auto-tmux (current state)
  - `.bashrc` and `.zshrc` have the tmux autostart block commented out so shells start clean.
  - Quick attach alias (Bash and Zsh):

    ```bash
    # Alias to manually attach or create shared tmux session
    alias wt='tmux new -As work'
    ```

- VS Code integration
  - Ensure it uses the system SSH (`C:\\Windows\\System32\\OpenSSH\\ssh.exe`) and `git` from PATH.
  - For GPG commits, pinentry windows appear as normal; no extra extensions required.

- Line endings hygiene
  - If editing shell RC files from Windows tools, convert back to LF inside WSL after changes:

    ```bash
    perl -pi -e 's/\r$//' ~/.bashrc ~/.zshrc
    ```

- 1Password (alternative SSH agent)
  - We're standardizing on Windows `ssh-agent`. If you later prefer 1Password's agent, set its socket in `~/.ssh/config` and remove keys from the Windows agent. Not needed for this setup.

---

## Troubleshooting

- "Could not open a connection to your authentication agent" in WSL
  - Ensure `npiperelay.exe` path is correct and the bridge script is sourced.
  - Reopen a new shell so the `socat` listener starts.
- Zsh/Bash shows `^M` or `command not found` at startup
  - Convert CRLF to LF in RC files: `perl -pi -e 's/\r$//' ~/.zshrc ~/.bashrc`.
- GPG keeps prompting
  - Verify `gpg-agent.conf` contents and TTLs, then `gpgconf --kill gpg-agent` to reload.

---

## Quick Verification Checklist

- Windows PowerShell:
  - `ssh-add -l` shows your ED25519 keys.
  - `ssh -T git@github.com` succeeds.
  - A signed `git commit` shows a single pinentry per workday.
- WSL (Ubuntu):
  - `ssh-add -l` shows the same keys.
  - `gpg --clearsign README.md` triggers a Qt GUI pinentry (first use), then caches.

This setup keeps SSH and GPG consistent across Windows and WSL with minimal prompts and a clean, predictable developer experience.


