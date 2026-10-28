# Sentinel | 보안 인텔리전스 대시보드

VirusTotal 등 위협 분석 API, 보안 뉴스와 공식 권고를 한곳에서 확인하는 보안 종합 솔루션의 시작 화면입니다.

## 현재 상태

- `index.html`: 한국어 반응형 대시보드 UI
- 지표 검색창은 화면 시안이며, 아직 실제 분석 API에 연결되어 있지 않습니다.
- 뉴스 카드도 자리 표시자입니다. 실제 뉴스/권고 피드 연결 후 출처와 게시 시각을 표시하세요.

## 보안 아키텍처 권장

브라우저에서 분석 업체 API를 직접 호출하지 마세요. API 키가 공개되고 남용될 수 있습니다.

1. 프런트엔드에서 서버의 자체 API(예: `/api/analyze`)로 해시/도메인/URL을 보냅니다.
2. 백엔드가 비밀 환경변수에 저장된 업체 키로 외부 API를 호출합니다.
3. 결과를 공통 형식으로 정규화하고 호출 제한, 입력 검증, 캐시, 오류 처리를 적용합니다.
4. 화면에는 업체별 근거와 조회 시각을 보여주고 단일 점수로 악성 여부를 단정하지 않습니다.

GitHub Pages는 정적 화면 호스팅입니다. 서버 비밀키를 안전하게 사용할 백엔드가 별도로 필요합니다. 키를 HTML/JavaScript, 저장소 파일, 공개 이슈, 빌드 로그에 넣지 마세요. 키가 노출되면 즉시 폐기하고 재발급하세요.

## VirusTotal API v3 시작하기

1. VirusTotal Community 계정을 만들고 API 키를 발급받습니다.
2. 백엔드 환경변수 `VT_API_KEY`에 저장합니다. 공개 저장소에 올리지 않습니다.
3. API v3의 파일 해시 조회는 `GET https://www.virustotal.com/api/v3/files/{sha256}`, 도메인 조회는 `GET https://www.virustotal.com/api/v3/domains/{domain}`, URL 조회는 URL 식별자를 사용합니다.
4. 요청 헤더에 `x-apikey: <키>`를 설정합니다. 해시 평판 조회부터 시작하고, 파일/URL 업로드는 사용자에게 외부 제출 사실을 알리고 동의를 받은 뒤 추가하세요.
5. `401`, `403`, `429` 및 공급자 오류를 처리하고 결과를 캐시해 호출량을 줄입니다.

VirusTotal Public API는 문서상 분당 4회, 일일 500회 제한이며 상업 제품/서비스에 사용할 수 없습니다. 사업용 또는 고객 제공 서비스로 확장하기 전에는 사용 조건을 검토하고 VirusTotal과 적절한 계약/권한을 확인해야 합니다.

## 다른 분석·위협정보 API

| 서비스 | 주 용도 | 참고 |
|---|---|---|
| [urlscan.io](https://docs.urlscan.io/) | URL 제출 스캔, 페이지 동작·연결 도메인·화면 결과 | URL을 외부에서 열어 분석하므로 민감 URL은 공개 제출 여부와 정책을 먼저 확인 |
| [AbuseIPDB](https://docs.abuseipdb.com/) | IP 주소 악용 신고·평판 조회 | API 키와 서비스별 사용 한도/약관 확인 |
| [AlienVault OTX](https://otx.alienvault.com/api) | 커뮤니티 기반 IOC와 위협 펄스 조회 | 지표 출처와 최신성을 함께 표시 |
| [abuse.ch / MalwareBazaar](https://bazaar.abuse.ch/api/) | 악성코드 해시·샘플 정보 | 샘플 취급 시 격리된 분석 환경 사용. 커뮤니티 API는 공정사용 원칙 적용 |
| [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | 실제 악용 확인 취약점 카탈로그 | 공식 데이터 피드/카탈로그를 가져와 취약점 대시보드에 활용 |

한 번에 모두 연동하기보다 **VirusTotal 해시 조회 → IP 평판 → URL 분석 → 뉴스·취약점 피드** 순서로 작게 확장하는 것을 권합니다.

## GitHub Pages 게시

저장소의 **Settings → Pages**에서 배포 소스를 **Deploy from a branch**, 브랜치 **main**, 폴더 **/(root)**로 선택하고 저장합니다. 이 저장소의 기본 페이지 경로는 보통 `https://wonbi.github.io/security-intelligence-platform/` 형식입니다. Pages 설정이 완료된 뒤 Actions 상태와 페이지 주소를 확인하세요.

## 참고 문서

- [VirusTotal API v3 개요](https://docs.virustotal.com/reference/overview)
- [VirusTotal Public/Premium API 차이와 제한](https://docs.virustotal.com/reference/public-vs-premium-api)
- [urlscan API 문서](https://docs.urlscan.io/)
- [AbuseIPDB API 문서](https://docs.abuseipdb.com/)
- [MalwareBazaar API 문서](https://bazaar.abuse.ch/api/)
