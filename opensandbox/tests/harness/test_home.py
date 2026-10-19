"""T1 regression: SDK installation is visible to the real CLI in the same isolated home."""
from __future__ import annotations

import importlib.util
import os
import shlex
import subprocess
from pathlib import Path


def test_contract_fixture_shares_home_with_the_node_engine(tmp_path, monkeypatch):
    import agent_sandbox.transport.config as config

    file = Path(__file__).resolve().parents[1] / "contract" / "conftest.py"
    spec = importlib.util.spec_from_file_location("opensandbox_contract_fixture_probe", file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, "_live", lambda: True)

    class Factory:
        def mktemp(self, _name):
            folder = tmp_path / "isolated-home"
            folder.mkdir()
            return folder

    old_home = os.environ.get("HOME")
    old_config = config._CONFIG_FILE
    fixture = module.installed_plugin.__wrapped__(Factory())
    try:
        next(fixture)
        assert config._CONFIG_FILE == Path.home() / ".abx" / "config.toml"
        assert Path.home() == tmp_path / "isolated-home"
        launcher = shlex.split(os.environ["ABX_BIN"])
        result = subprocess.run(
            [*launcher, "provider", "doctor", "opensandbox"],
            text=True, capture_output=True, timeout=30, check=False, cwd=tmp_path,
        )
        assert result.returncode == 0, result.stdout + result.stderr
    finally:
        fixture.close()
    assert os.environ.get("HOME") == old_home
    assert config._CONFIG_FILE == old_config
