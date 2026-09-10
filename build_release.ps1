$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonPath = Join-Path $env:LOCALAPPDATA 'Python\pythoncore-3.14-64\python.exe'
$packagePath = Join-Path $projectRoot '.venv\Lib\site-packages'
$releaseRoot = Join-Path $projectRoot 'release'
$packageRoot = Join-Path $releaseRoot 'CSV整理くん_v0.1.0'
$buildRoot = Join-Path $projectRoot 'build'
$specPath = Join-Path $projectRoot 'CSV整理くん.spec'
$zipPath = Join-Path $releaseRoot 'CSV整理くん_v0.1.0.zip'

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw 'ビルドに使用するPythonが見つかりません。'
}
if (-not (Test-Path -LiteralPath (Join-Path $packagePath 'PyInstaller'))) {
    throw '専用環境にPyInstallerがありません。'
}

foreach ($target in @($releaseRoot, $buildRoot)) {
    if (Test-Path -LiteralPath $target) {
        $resolved = (Resolve-Path -LiteralPath $target).Path
        if (-not $resolved.StartsWith($projectRoot + '\')) {
            throw "削除対象がプロジェクト外です: $resolved"
        }
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
if (Test-Path -LiteralPath $specPath) {
    Remove-Item -LiteralPath $specPath -Force
}

New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null

$previousPythonPath = $env:PYTHONPATH
$env:PYTHONPATH = $packagePath

& $pythonPath -m PyInstaller `
    --noconfirm `
    --clean `
    --onefile `
    --windowed `
    --name 'CSV整理くん' `
    --distpath $packageRoot `
    --workpath $buildRoot `
    (Join-Path $projectRoot 'app.py')

if ($LASTEXITCODE -ne 0) {
    throw "EXEの作成に失敗しました。終了コード: $LASTEXITCODE"
}

$env:PYTHONPATH = $previousPythonPath

Copy-Item -LiteralPath (Join-Path $projectRoot '操作説明書.txt') -Destination $packageRoot
Copy-Item -LiteralPath (Join-Path $projectRoot 'sample') -Destination $packageRoot -Recurse

Compress-Archive -LiteralPath $packageRoot -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "販売用ファイルを作成しました:"
Write-Host $zipPath
