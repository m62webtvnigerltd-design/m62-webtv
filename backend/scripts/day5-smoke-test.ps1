param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,

    [Parameter(Mandatory = $true)]
    [string]$FrontendUrl,

    [Parameter(Mandatory = $false)]
    [string]$AdminApiKey = ""
)

$ErrorActionPreference = 'Stop'

function Add-Result {
    param(
        [string]$Name,
        [bool]$Ok,
        [string]$Detail
    )

    [PSCustomObject]@{
        Test = $Name
        Status = if ($Ok) { 'PASS' } else { 'FAIL' }
        Detail = $Detail
    }
}

function Try-Request {
    param(
        [string]$Name,
        [scriptblock]$Block
    )

    try {
        $response = & $Block
        return Add-Result -Name $Name -Ok $true -Detail ($response | Out-String).Trim()
    } catch {
        $message = $_.Exception.Message
        return Add-Result -Name $Name -Ok $false -Detail $message
    }
}

$results = @()

$results += Try-Request -Name 'API health' -Block {
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/health"
    if (-not $r.status) { throw 'Missing health status field' }
    "health ok"
}

$results += Try-Request -Name 'Dashboard stats' -Block {
    $r = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/api/stats/dashboard"
    if (-not $r.success) { throw 'Stats endpoint did not return success=true' }
    "stats ok"
}

$results += Try-Request -Name 'CORS preflight from frontend origin' -Block {
    $statusCode = & curl.exe -s -o NUL -w "%{http_code}" -X OPTIONS "$ApiBaseUrl/api/health" -H "Origin: $FrontendUrl" -H "Access-Control-Request-Method: GET"
    if ($statusCode -ne '204' -and $statusCode -ne '200') {
        throw "Unexpected preflight HTTP status: $statusCode"
    }
    "preflight http $statusCode"
}

if (-not [string]::IsNullOrWhiteSpace($AdminApiKey)) {
    $results += Try-Request -Name 'Admin key protected endpoint' -Block {
        $statusCode = & curl.exe -s -o NUL -w "%{http_code}" -H "x-admin-key: $AdminApiKey" "$ApiBaseUrl/api/engagement/moderation/comments"
        if ($statusCode -ne '200') {
            throw "Expected 200, got $statusCode"
        }
        "moderation http $statusCode"
    }
}

$passCount = ($results | Where-Object { $_.Status -eq 'PASS' }).Count
$failCount = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count

$results | Format-Table -AutoSize
Write-Host ""
Write-Host "Summary: PASS=$passCount FAIL=$failCount"

if ($failCount -gt 0) {
    exit 1
}
