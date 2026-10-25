"""Fixtures for the pytest tier: install the plugin into a throwaway store, talk to a live server.

Opt in with ``OPENSANDBOX_LIVE=1``, ``ABX_OPENSANDBOX_BASE_URL`` and
``ABX_OPENSANDBOX_API_KEY``. Without opt-in tests skip; an explicitly requested
live run fails if its server is missing or unreachable.
"""

from __future__ import annotations

import os
import urllib.request
from pathlib import Path

import pytest

PLUGIN_DIR = Path(__file__).resolve().parents[2]
BASE_URL = os.environ.get("ABX_OPENSANDBOX_BASE_URL")


def _live() -> bool:
    if os.environ.get("OPENSANDBOX_LIVE") != "1":
        return False
    if not BASE_URL:
        raise RuntimeError("Explicit live tests require ABX_OPENSANDBOX_BASE_URL")
    url = BASE_URL if BASE_URL.startswith("http") else f"http://{BASE_URL}"
    try:
        with urllib.request.urlopen(url.rstrip("/").removesuffix("/v1") + "/health", timeout=3):
            return True
    except OSError as exc:
        raise RuntimeError("Explicit live tests could not reach the configured server") from exc


def pytest_collection_modifyitems(config, items):
    if _live():
        return
    skip = pytest.mark.skip(
        reason="set OPENSANDBOX_LIVE=1 and ABX_OPENSANDBOX_BASE_URL to a reachable server"
    )
    for item in items:
        if str(PLUGIN_DIR) in str(item.fspath):
            item.add_marker(skip)


@pytest.fixture(scope="session", autouse=True)
def installed_plugin(tmp_path_factory):
    """Install the plugin by local path into an isolated ``~/.abx`` (never touches the real one)."""
    if not _live():
        yield None
        return
    import agent_sandbox.transport.config as config_module
    from agent_sandbox.providers import installer, registry

    home = tmp_path_factory.mktemp("abx-home")
    # The SDK store and the spawned Node engine must resolve the same HOME.
    # Patching only the Python config path leaves the CLI looking in a different
    # store and writing engine.json where SDK discovery cannot see it.
    with pytest.MonkeyPatch.context() as patch:
        patch.setenv("HOME", str(home))
        patch.setenv("USERPROFILE", str(home))
        patch.setattr(config_module, "_CONFIG_FILE", home / ".abx" / "config.toml")
        try:
            receipt = installer.install(str(PLUGIN_DIR), yes=True)
            yield receipt
        finally:
            registry.reset_registry()
