/**
 * Canonical GitHub home of the dhun CLI.
 * The repository is the single source of truth for installs — no PyPI
 * release, no brew, no install scripts.
 */
export const GITHUB_REPO = "https://github.com/Pratikkk/dhun";

/** Short repo handle used in UI labels. */
export const GITHUB_REPO_LABEL = "Pratikkk/dhun";

/** The one supported install method: pip, straight from the GitHub repo. */
export const INSTALL_COMMAND = `pip install git+${GITHUB_REPO}.git`;

/** External-link attributes shared by all outgoing GitHub links. */
export const EXTERNAL_LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;
