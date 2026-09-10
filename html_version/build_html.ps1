$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceRoot = Join-Path $projectRoot 'src'
$distRoot = Join-Path $projectRoot 'dist'
$packageRoot = Join-Path $distRoot 'CSV整理くん_オフライン版_v1.0.0'
$zipPath = Join-Path $distRoot 'CSV整理くん_オフライン版_v1.0.0.zip'

if (Test-Path -LiteralPath $distRoot) {
    $resolved = (Resolve-Path -LiteralPath $distRoot).Path
    if (-not $resolved.StartsWith($projectRoot + '\')) {
        throw "削除対象がプロジェクト外です: $resolved"
    }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}

$template = Get-Content -LiteralPath (Join-Path $sourceRoot 'template.html') -Raw -Encoding UTF8
$styles = Get-Content -LiteralPath (Join-Path $sourceRoot 'styles.css') -Raw -Encoding UTF8
$script = Get-Content -LiteralPath (Join-Path $sourceRoot 'app.mjs') -Raw -Encoding UTF8
$html = $template.Replace('/*__STYLES__*/', $styles).Replace('//__SCRIPT__', $script)

New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null
Set-Content -LiteralPath (Join-Path $packageRoot 'CSV整理くん.html') -Value $html -Encoding UTF8
Copy-Item -LiteralPath (Join-Path $projectRoot '操作説明書.txt') -Destination $packageRoot
Copy-Item -LiteralPath (Join-Path (Split-Path -Parent $projectRoot) 'sample') -Destination $packageRoot -Recurse

Compress-Archive -LiteralPath $packageRoot -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "オフラインHTML版を作成しました: $zipPath"
