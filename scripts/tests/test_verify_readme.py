import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "verify_readme.py"


def load_validator():
    spec = importlib.util.spec_from_file_location("verify_readme", SCRIPT)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def png_header(width: int, height: int) -> bytes:
    return b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + width.to_bytes(4, "big") + height.to_bytes(4, "big")


class VerifyReadmeTests(unittest.TestCase):
    def make_repo(self, readme: str, files: dict[str, bytes | str] | None = None) -> Path:
        root = Path(tempfile.mkdtemp())
        (root / "README.md").write_text(readme, encoding="utf-8")
        for relative, content in (files or {}).items():
            target = root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            if isinstance(content, bytes):
                target.write_bytes(content)
            else:
                target.write_text(content, encoding="utf-8")
        return root

    def test_accepts_valid_header_link_image_and_desktop_evidence(self) -> None:
        validator = load_validator()
        root = self.make_repo(
            '<a href="#overview"><img src="badge.svg" alt="Overview" /></a>\n'
            '<a name="overview"></a>\n'
            '<img src="docs/assets/personal-page-readme-banner.svg" alt="Banner" />\n'
            '![Main page](docs/screenshots/main-page.png)\n',
            {
                "badge.svg": "<svg/>",
                "docs/assets/personal-page-readme-banner.svg": "<svg/>",
                "docs/screenshots/main-page.png": png_header(1920, 1080),
            },
        )

        self.assertEqual(
            [],
            [finding for finding in validator.validate(root) if not finding.startswith("RMD004: README.md: missing required anchor")],
        )

    def test_reports_missing_header_anchor(self) -> None:
        validator = load_validator()
        root = self.make_repo('<a href="#quality"><img src="badge.svg" alt="Quality" /></a>\n', {"badge.svg": "<svg/>"})

        self.assertIn("RMD004", "\n".join(validator.validate(root)))

    def test_reports_missing_local_image_and_path_leak(self) -> None:
        validator = load_validator()
        root = self.make_repo("![Missing](docs/missing.png)\nRun from /opt/dev/personal-page.\n")

        findings = "\n".join(validator.validate(root))
        self.assertIn("RMD003", findings)
        self.assertIn("RMD006", findings)

    def test_reports_non_desktop_main_page_evidence(self) -> None:
        validator = load_validator()
        root = self.make_repo(
            "![Main page](docs/screenshots/main-page.png)\n",
            {"docs/screenshots/main-page.png": png_header(375, 812)},
        )

        self.assertIn("RMD007", "\n".join(validator.validate(root)))

    def test_reports_missing_readme_banner(self) -> None:
        validator = load_validator()
        root = self.make_repo(
            "![Main page](docs/screenshots/main-page.png)\n",
            {"docs/screenshots/main-page.png": png_header(1920, 1080)},
        )

        self.assertIn("RMD010", "\n".join(validator.validate(root)))

    def test_current_readme_references_committed_desktop_main_page(self) -> None:
        validator = load_validator()
        root = SCRIPT.parents[1]
        readme = (root / "README.md").read_text(encoding="utf-8")

        self.assertIn('<img src="docs/assets/personal-page-readme-banner.svg"', readme)
        self.assertIn('<a name="visual-proof"></a>', readme)
        self.assertIn("docs/screenshots/main-page.png", readme)
        self.assertEqual([], validator.validate(root))


if __name__ == "__main__":
    unittest.main()
