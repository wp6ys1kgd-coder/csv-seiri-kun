"""CSV整理くん - 初心者向けWindowsデスクトップアプリ。"""

from __future__ import annotations

import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from csv_cleaner import CsvCleanerError, clean_csv, read_csv


APP_TITLE = "CSV整理くん"
APP_VERSION = "0.1.0"
NO_SORT = "（並べ替えない）"


class CsvCleanerApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("720x550")
        self.minsize(650, 500)
        self.configure(bg="#f4f7fb")

        self.input_path = tk.StringVar()
        self.sort_column = tk.StringVar(value=NO_SORT)
        self.status = tk.StringVar(value="CSVファイルを選ぶところから始めましょう。")
        self.details = tk.StringVar(value="")

        self._configure_styles()
        self._build_ui()

    def _configure_styles(self) -> None:
        style = ttk.Style(self)
        if "vista" in style.theme_names():
            style.theme_use("vista")
        style.configure("Title.TLabel", font=("Yu Gothic UI", 22, "bold"), background="#f4f7fb", foreground="#16324f")
        style.configure("Intro.TLabel", font=("Yu Gothic UI", 10), background="#f4f7fb", foreground="#4b6175")
        style.configure("Card.TFrame", background="#ffffff", relief="solid", borderwidth=1)
        style.configure("Card.TLabel", font=("Yu Gothic UI", 10), background="#ffffff", foreground="#243746")
        style.configure("Step.TLabel", font=("Yu Gothic UI", 11, "bold"), background="#ffffff", foreground="#16324f")
        style.configure("Primary.TButton", font=("Yu Gothic UI", 11, "bold"), padding=(16, 10))
        style.configure("Secondary.TButton", font=("Yu Gothic UI", 10), padding=(12, 7))
        style.configure("Status.TLabel", font=("Yu Gothic UI", 10), background="#eaf3ff", foreground="#174a7c")

    def _build_ui(self) -> None:
        outer = ttk.Frame(self, padding=(28, 22))
        outer.pack(fill="both", expand=True)

        ttk.Label(outer, text=APP_TITLE, style="Title.TLabel").pack(anchor="w")
        ttk.Label(
            outer,
            text="空行と重複データを取り除き、見やすい順番に整理します。元のCSVは変更しません。",
            style="Intro.TLabel",
        ).pack(anchor="w", pady=(3, 18))

        card = ttk.Frame(outer, style="Card.TFrame", padding=22)
        card.pack(fill="both", expand=True)

        ttk.Label(card, text="1  整理するCSVを選ぶ", style="Step.TLabel").grid(row=0, column=0, columnspan=2, sticky="w")
        path_entry = ttk.Entry(card, textvariable=self.input_path, state="readonly")
        path_entry.grid(row=1, column=0, sticky="ew", pady=(8, 8), padx=(0, 10))
        ttk.Button(card, text="CSVを選ぶ", command=self.choose_csv, style="Secondary.TButton").grid(row=1, column=1, sticky="e", pady=(8, 8))

        ttk.Separator(card).grid(row=2, column=0, columnspan=2, sticky="ew", pady=14)

        ttk.Label(card, text="2  並べ替える列を選ぶ（任意）", style="Step.TLabel").grid(row=3, column=0, columnspan=2, sticky="w")
        self.sort_combo = ttk.Combobox(card, textvariable=self.sort_column, values=[NO_SORT], state="readonly", font=("Yu Gothic UI", 10))
        self.sort_combo.grid(row=4, column=0, columnspan=2, sticky="ew", pady=(8, 8))

        ttk.Separator(card).grid(row=5, column=0, columnspan=2, sticky="ew", pady=14)

        ttk.Label(card, text="3  整理して保存する", style="Step.TLabel").grid(row=6, column=0, columnspan=2, sticky="w")
        self.run_button = ttk.Button(card, text="整理したCSVを保存", command=self.run_cleaning, state="disabled", style="Primary.TButton")
        self.run_button.grid(row=7, column=0, columnspan=2, pady=(12, 10))

        status_frame = ttk.Frame(card, style="Card.TFrame")
        status_frame.grid(row=8, column=0, columnspan=2, sticky="ew", pady=(8, 0))
        ttk.Label(status_frame, textvariable=self.status, style="Status.TLabel", padding=(12, 10), wraplength=580).pack(fill="x")
        ttk.Label(status_frame, textvariable=self.details, style="Card.TLabel", padding=(12, 8), wraplength=580).pack(fill="x")

        ttk.Label(card, text="※ 保存結果はExcelで開きやすいUTF-8形式です。", style="Card.TLabel").grid(row=9, column=0, columnspan=2, sticky="w", pady=(14, 0))
        ttk.Label(outer, text=f"試作版 v{APP_VERSION}", style="Intro.TLabel").pack(anchor="e", pady=(8, 0))
        card.columnconfigure(0, weight=1)
        card.rowconfigure(8, weight=1)

    def choose_csv(self) -> None:
        selected = filedialog.askopenfilename(
            title="整理するCSVを選択",
            filetypes=[("CSVファイル", "*.csv"), ("すべてのファイル", "*.*")],
        )
        if not selected:
            return

        try:
            data = read_csv(selected)
        except CsvCleanerError as exc:
            messagebox.showerror("CSVを開けません", str(exc), parent=self)
            self.run_button.configure(state="disabled")
            return

        self.input_path.set(selected)
        self.sort_combo.configure(values=[NO_SORT, *data.headers])
        self.sort_column.set(NO_SORT)
        self.run_button.configure(state="normal")
        self.status.set("CSVを読み込みました。並べ替える列を選び、保存ボタンを押してください。")
        self.details.set(f"列数：{len(data.headers)}　データ行数：{len(data.rows)}　読み込み形式：{data.encoding}")

    def run_cleaning(self) -> None:
        source_text = self.input_path.get()
        if not source_text:
            messagebox.showwarning("CSVを選んでください", "先に整理するCSVを選んでください。", parent=self)
            return

        source = Path(source_text)
        destination = filedialog.asksaveasfilename(
            title="整理したCSVの保存先",
            defaultextension=".csv",
            initialdir=source.parent,
            initialfile=f"{source.stem}_整理済み.csv",
            filetypes=[("CSVファイル", "*.csv")],
        )
        if not destination:
            return

        selected_sort = self.sort_column.get()
        sort_column = None if selected_sort == NO_SORT else selected_sort
        try:
            result = clean_csv(source, destination, sort_column)
        except CsvCleanerError as exc:
            messagebox.showerror("整理できませんでした", str(exc), parent=self)
            self.status.set("処理を完了できませんでした。内容を確認してください。")
            return

        self.status.set("整理が完了しました。元のCSVは変更されていません。")
        self.details.set(
            f"処理前：{result.input_count}行 → 保存後：{result.output_count}行\n"
            f"空行：{result.blank_count}行削除　重複：{result.duplicate_count}行削除\n"
            f"保存先：{result.output_path}"
        )
        messagebox.showinfo(
            "整理が完了しました",
            f"整理済みCSVを保存しました。\n\n"
            f"処理前：{result.input_count}行\n"
            f"保存後：{result.output_count}行\n"
            f"空行削除：{result.blank_count}行\n"
            f"重複削除：{result.duplicate_count}行",
            parent=self,
        )


if __name__ == "__main__":
    CsvCleanerApp().mainloop()
