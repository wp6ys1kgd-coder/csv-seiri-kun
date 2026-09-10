import csv
import tempfile
import unittest
from pathlib import Path

from csv_cleaner import CsvCleanerError, clean_csv, read_csv


class CsvCleanerTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.directory = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_removes_blank_and_duplicate_rows_and_sorts(self):
        source = self.directory / "input.csv"
        output = self.directory / "output.csv"
        source.write_text(
            "氏名,メール,金額\n"
            "山田 花子,hanako@example.com,2000\n"
            ",,\n"
            "佐藤 太郎,taro@example.com,1000\n"
            "山田 花子,hanako@example.com,2000\n",
            encoding="utf-8-sig",
        )

        result = clean_csv(source, output, "氏名")

        self.assertEqual(result.input_count, 4)
        self.assertEqual(result.output_count, 2)
        self.assertEqual(result.blank_count, 1)
        self.assertEqual(result.duplicate_count, 1)
        with output.open(encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.assertEqual([row["氏名"] for row in rows], ["佐藤 太郎", "山田 花子"])

    def test_reads_shift_jis_csv(self):
        source = self.directory / "shift_jis.csv"
        source.write_text("商品,数量\nりんご,3\n", encoding="cp932")

        data = read_csv(source)

        self.assertEqual(data.encoding, "cp932")
        self.assertEqual(data.rows[0]["商品"], "りんご")

    def test_strips_surrounding_spaces_before_duplicate_check(self):
        source = self.directory / "spaces.csv"
        output = self.directory / "output.csv"
        source.write_text("名前,地域\n田中,東京\n 田中 , 東京 \n", encoding="utf-8")

        result = clean_csv(source, output)

        self.assertEqual(result.output_count, 1)
        self.assertEqual(result.duplicate_count, 1)

    def test_rejects_overwriting_original(self):
        source = self.directory / "same.csv"
        source.write_text("名前\n田中\n", encoding="utf-8")

        with self.assertRaises(CsvCleanerError):
            clean_csv(source, source)


if __name__ == "__main__":
    unittest.main()
