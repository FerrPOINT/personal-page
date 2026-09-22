#!/usr/bin/env python3
"""Validate Personal Page README links, navigation, and desktop evidence."""

from __future__ import annotations

import re
import struct
import sys
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
MARKDOWN_LINK_RE = re.compile(r"(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
MARKDOWN_IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
HTML_IMAGE_RE = re.compile(r"<img\b[^>]*\bsrc=[\"']([^\"']+)[\"']", re.IGNORECASE)
HEADER_LINK_RE = re.compile(r"<a\b[^>]*\bhref=[\"']#([^\"']+)[\"'][^>]*>", re.IGNORECASE)
NAMED_ANCHOR_RE = re.compile(r"<a\b[^>]*\bname=[\"']([^\"']+)[\"'][^>]*>", re.IGNORECASE)
CI_BADGE_RE = re.compile(r"actions/workflows/([^/?#]+\.ya?ml)(?:/badge\.svg|\?[^\s)]*)", re.IGNORECASE)
PLACEHOLDER_RE = re.compile(r"\{\{[^{}]+\}\}")
LOCAL_PATH_RE = re.compile(r"(?:file://|(?<![A-Za-z0-9_])/(?:opt|root)/)")
EXTERNAL_PREFIXES = ("https://", "http://", "mailto:", "data:", "#")
REQUIRED_ANCHORS = {"overview", "capabilities", "quick-start", "visual-proof", "architecture", "quality"}
MAIN_PAGE_SCREENSHOT = Path("docs/screenshots/main-page.png")


def resolve_local(root: Path, target: str) -> Path | None:
    decoded = unquote(target).split("#", 1)[0]
    if not decoded or decoded.startswith(EXTERNAL_PREFIXES):
        return None
    candidate = (root / decoded).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate


def png_size(path: Path) -> tuple[int, int] | None:
    header = path.read_bytes()[:24]
    if not header.startswith(b"\x89PNG\r\n\x1a\n") or header[12:16] != b"IHDR":
        return None
    return struct.unpack(">II", header[16:24])


def validate(root: Path = ROOT) -> list[str]:
    readme = root / "README.md"
    if not readme.is_file():
        return ["RMD001: README.md missing"]

    try:
        text = readme.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return ["RMD001: README.md is not UTF-8"]

    findings: list[str] = []
    image_targets = set(MARKDOWN_IMAGE_RE.findall(text)) | set(HTML_IMAGE_RE.findall(text))
    link_targets = set(MARKDOWN_LINK_RE.findall(text)) - image_targets

    for target in sorted(link_targets):
        path = resolve_local(root, target)
        if path is not None and not path.exists():
            findings.append(f"RMD002: README.md: broken local link {target}")

    for target in sorted(image_targets):
        path = resolve_local(root, target)
        if path is not None and not path.is_file():
            findings.append(f"RMD003: README.md: missing local image {target}")

    header = text.split("\n---", 1)[0]
    anchors = {anchor.lower() for anchor in NAMED_ANCHOR_RE.findall(text)}
    for target in sorted(set(HEADER_LINK_RE.findall(header))):
        if target.lower() not in anchors:
            findings.append(f"RMD004: README.md: missing explicit anchor #{target}")
    for target in sorted(REQUIRED_ANCHORS - anchors):
        findings.append(f"RMD004: README.md: missing required anchor #{target}")

    if PLACEHOLDER_RE.search(text):
        findings.append("RMD005: README.md: unresolved placeholder")
    if LOCAL_PATH_RE.search(text):
        findings.append("RMD006: README.md: local filesystem path leaked")

    screenshot = root / MAIN_PAGE_SCREENSHOT
    if not screenshot.is_file():
        findings.append(f"RMD007: README.md: missing required desktop evidence {MAIN_PAGE_SCREENSHOT}")
    else:
        size = png_size(screenshot)
        if size != (1920, 1080):
            findings.append(f"RMD007: {MAIN_PAGE_SCREENSHOT}: expected 1920x1080, got {size}")
        if MAIN_PAGE_SCREENSHOT.as_posix() not in image_targets:
            findings.append(f"RMD007: README.md: does not reference {MAIN_PAGE_SCREENSHOT}")

    for workflow in sorted(set(CI_BADGE_RE.findall(text))):
        if not (root / ".github" / "workflows" / workflow).is_file():
            findings.append(f"RMD009: README.md: CI badge references missing workflow {workflow}")

    return findings


def main() -> int:
    findings = validate()
    if findings:
        print("\n".join(findings))
        return 1
    print("README validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
