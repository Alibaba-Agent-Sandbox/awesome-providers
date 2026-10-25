"""Explicit live acceptance must never turn a missing backend into a skip."""
from __future__ import annotations

import importlib.util
from pathlib import Path
from urllib.error import URLError

import pytest


@pytest.fixture
def contract():
    path = Path(__file__).resolve().parents[1] / "contract" / "conftest.py"
    spec = importlib.util.spec_from_file_location("opensandbox_live_gate_probe", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_no_opt_in_skips_without_contacting_backend(contract, monkeypatch):
    monkeypatch.delenv("OPENSANDBOX_LIVE", raising=False)
    assert contract._live() is False


def test_explicit_live_run_requires_its_endpoint(contract, monkeypatch):
    monkeypatch.setenv("OPENSANDBOX_LIVE", "1")
    monkeypatch.setattr(contract, "BASE_URL", None)
    with pytest.raises(RuntimeError, match="require ABX_OPENSANDBOX_BASE_URL"):
        contract._live()


def test_explicit_live_run_fails_for_unreachable_backend(contract, monkeypatch):
    monkeypatch.setenv("OPENSANDBOX_LIVE", "1")
    monkeypatch.setattr(contract, "BASE_URL", "http://unused.invalid")

    def unreachable(*args, **kwargs):
        raise URLError("controlled unavailable backend")

    monkeypatch.setattr(contract.urllib.request, "urlopen", unreachable)
    with pytest.raises(RuntimeError, match="could not reach"):
        contract._live()
