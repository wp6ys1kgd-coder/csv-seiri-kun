# CSV整理くん（試作品）

初心者向けのCSV整理ツールです。販売候補は、インストールとコード署名が不要なオフラインHTML版です。初期のPythonデスクトップ版も開発記録として残しています。

## ファイル構成

- `app.py`：デスクトップ画面
- `csv_cleaner.py`：CSV整理処理
- `CSV整理くんを起動.bat`：利用者向け起動ファイル
- `テストを実行.bat`：自動テスト起動ファイル
- `sample/顧客リスト_サンプル.csv`：動作確認用データ
- `tests/test_csv_cleaner.py`：自動テスト
- `操作説明書.md`：初心者向けの操作手順
- `build_release.ps1`：販売用EXEとZIPの作成スクリプト
- `販売準備/`：出品文、購入前ヒアリング票、納品チェックリスト
- `html_version/`：販売用のオフラインHTML版、テスト、配布ZIP

## 開発者向け起動方法

```powershell
python app.py
```

## 自動テスト

```powershell
python -m unittest discover -s tests -v
```

## 現在の仕様

- UTF-8、UTF-8 BOM付き、CP932のCSVを自動判定
- 空行削除
- 全列が一致する重複行の削除
- セル前後の空白削除
- 指定列による文字順の並べ替え
- UTF-8 BOM付きCSVとして別名保存

現在の販売候補はオフラインHTML版です。数値順・日付順、列単位の重複判定、処理ルールの保存などは今後の拡張候補です。

## Workへ引き継ぐ場合

出品作業を別のChatGPT Workで続ける場合は、まずこのリポジトリをGitHubへpushしてください。Work側で`README.md`と`HANDOFF.md`を読ませると、完成ファイル、使い方、未完成部分、出品文の場所を共有できます。公開操作や画像アップロードは、Work側で最終確認してから行います。

## 販売用ファイルの作成

プロジェクト専用環境にPyInstallerをインストールした状態で、次を実行します。

```powershell
.\build_release.ps1
```

`release` フォルダーに、Windows用EXEを含むZIPが作成されます。
