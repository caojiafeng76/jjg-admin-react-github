Get-ChildItem 'e:\code\jjg-admin-react-github\node_modules\@rc-component\' -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'node_modules\@rc-component\util\package.json') } | ForEach-Object {
    $utilPath = Join-Path $_.FullName 'node_modules\@rc-component\util\package.json'
    $v = (Get-Content $utilPath | ConvertFrom-Json).version
    Write-Host "$($_.Name) -> @rc-component/util@$v"
}
