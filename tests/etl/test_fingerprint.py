from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path

from etl.fingerprint import fingerprint_file, sha256_file


class FingerprintTests(unittest.TestCase):
    def test_hashes_file_contents(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            sample_path = Path(tmp_dir) / "sample.txt"
            sample_path.write_text("official fixture\n", encoding="utf-8")

            expected = hashlib.sha256(b"official fixture\n").hexdigest()

            self.assertEqual(sha256_file(sample_path), expected)

    def test_describes_file_size_and_hash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            sample_path = Path(tmp_dir) / "sample.csv"
            sample_path.write_text("a,b\n1,2\n", encoding="utf-8")

            fingerprint = fingerprint_file(sample_path)

            self.assertEqual(fingerprint.size_bytes, len("a,b\n1,2\n"))
            self.assertEqual(
                fingerprint.sha256,
                hashlib.sha256(b"a,b\n1,2\n").hexdigest(),
            )


if __name__ == "__main__":
    unittest.main()
