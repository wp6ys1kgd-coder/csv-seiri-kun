"""CSV整理くんの中核処理。

外部ライブラリを使わず、CSVの読み込み、空行削除、重複削除、
並べ替え、UTF-8(BOM付き)での保存を行います。
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


SUPPORTED_ENCODINGS = ("utf-8-sig", "cp932", "utf-8")


class CsvCleanerError(Exception):
    """利用者にそのまま表示できるCSV処理エラー。"""


@dataclass(frozen=True)
class CsvData:
    headers: list[str]
    rows: list[dict[str, str]]
    encoding: str


@dataclass(frozen=True)
class CleanResult:
    input_count: int
    output_count: int
    blank_count: int
    duplicate_count: int
    output_path: Path


def _read_text(path: Path) -> tuple[str, str]:
    if not path.exists():
        raise CsvCleanerError("選択したCSVファイルが見つかりません。")
    if not path.is_file():
        raise CsvCleanerError("ファイルを選択してください。")

    for encoding in SUPPORTED_ENCODINGS:
        try:
            return path.read_text(encoding=encoding), encoding
        except UnicodeDecodeError:
            continue
        except OSError as exc:
            raise CsvCleanerError(f"CSVファイルを開けませんでした。\n{exc}") from exc

    raise CsvCleanerError(
        "CSVの文字コードを判定できませんでした。\n"
        "UTF-8またはShift-JIS形式のCSVを選んでください。"
    )


def read_csv(path: str | Path) -> CsvData:
    """CSVを読み込み、見出しと行を返す。"""
    csv_path = Path(path)
    text, encoding = _read_text(csv_path)
    if not text.strip():
        raise CsvCleanerError("CSVファイルが空です。")

    try:
        reader = csv.DictReader(text.splitlines())
        if not reader.fieldnames:
            raise CsvCleanerError("1行目に列名がありません。")

        headers = [header.strip() if header else "" for header in reader.fieldnames]
        if any(not header for header in headers):
            raise CsvCleanerError("空の列名があります。1行目の列名を確認してください。")
        if len(headers) != len(set(headers)):
            raise CsvCleanerError("同じ列名が複数あります。列名を重複しないようにしてください。")

        rows: list[dict[str, str]] = []
        for source_row in reader:
            if None in source_row:
                raise CsvCleanerError("列数が見出しより多い行があります。CSVを確認してください。")
            row = {
                header: (source_row.get(original_header) or "").strip()
                for header, original_header in zip(headers, reader.fieldnames)
            }
            rows.append(row)
    except csv.Error as exc:
        raise CsvCleanerError(f"CSVの形式を読み取れませんでした。\n{exc}") from exc

    return CsvData(headers=headers, rows=rows, encoding=encoding)


def _is_blank(row: dict[str, str], headers: list[str]) -> bool:
    return all(not row[header].strip() for header in headers)


def clean_rows(
    data: CsvData, sort_column: str | None = None
) -> tuple[list[dict[str, str]], int, int]:
    """空行と重複行を除き、必要なら指定列で並べ替える。"""
    if sort_column and sort_column not in data.headers:
        raise CsvCleanerError(f"列「{sort_column}」がCSVにありません。")

    cleaned: list[dict[str, str]] = []
    seen: set[tuple[str, ...]] = set()
    blank_count = 0
    duplicate_count = 0

    for row in data.rows:
        if _is_blank(row, data.headers):
            blank_count += 1
            continue

        key = tuple(row[header] for header in data.headers)
        if key in seen:
            duplicate_count += 1
            continue

        seen.add(key)
        cleaned.append(row)

    if sort_column:
        cleaned.sort(key=lambda row: row[sort_column].casefold())

    return cleaned, blank_count, duplicate_count


def clean_csv(
    input_path: str | Path,
    output_path: str | Path,
    sort_column: str | None = None,
) -> CleanResult:
    """CSVを整理し、Excelで開きやすいUTF-8(BOM付き)で保存する。"""
    input_csv = Path(input_path)
    output_csv = Path(output_path)
    if input_csv.resolve() == output_csv.resolve():
        raise CsvCleanerError("元のCSVとは別の名前で保存してください。")

    data = read_csv(input_csv)
    cleaned, blank_count, duplicate_count = clean_rows(data, sort_column)

    try:
        output_csv.parent.mkdir(parents=True, exist_ok=True)
        with output_csv.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=data.headers)
            writer.writeheader()
            writer.writerows(cleaned)
    except OSError as exc:
        raise CsvCleanerError(f"保存できませんでした。\n{exc}") from exc

    return CleanResult(
        input_count=len(data.rows),
        output_count=len(cleaned),
        blank_count=blank_count,
        duplicate_count=duplicate_count,
        output_path=output_csv,
    )
