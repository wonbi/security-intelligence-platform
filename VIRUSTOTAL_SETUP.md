# VirusTotal API 연결

GitHub Pages는 화면을 제공하고, 이 Cloudflare Worker가 VirusTotal API 키를 숨긴 채 조회를 중계합니다. API 키는 공개 저장소나 웹페이지 코드에 넣지 마세요.

## 1. Cloudflare Worker 만들기

1. Cloudflare 계정에서 **Workers & Pages → Create → Worker**로 새 Worker를 만듭니다.
2. Worker 편집 화면에서 `worker/index.js` 내용을 붙여넣고 배포합니다.
3. Worker의 **Settings → Variables and Secrets**에서 Secret `VT_API_KEY`를 추가하고 VirusTotal 키를 입력합니다.
4. 같은 화면에서 일반 변수 `ALLOWED_ORIGIN`을 `https://wonbi.github.io`로 설정합니다.
5. Worker 주소의 `/api/health`를 열어 `{"ok":true,"provider":"VirusTotal"}` 응답을 확인합니다.

## 2. 대시보드 연결

Worker 주소를 대시보드의 API 연결 설정에 입력하고 저장하면 됩니다. 주소는 `https://<worker-name>.<account>.workers.dev` 형태입니다. 끝에 슬래시나 `/api`를 붙이지 마세요.

## 제공되는 조회

- `GET /api/health`: 연결 상태
- `GET /api/lookup?type=hash&value=<해시>`: MD5, SHA-1, SHA-256 평판
- `GET /api/lookup?type=domain&value=<도메인>`: 도메인 평판
- `GET /api/lookup?type=ip&value=<IP>`: IP 평판
- `GET /api/lookup?type=url&value=<URL>`: 이미 VirusTotal에 존재하는 URL 평판

## 유의사항

- VirusTotal API 이용 한도와 사용 조건은 계정 유형에 따라 달라질 수 있습니다. 공개 무료 API는 상용 서비스에 사용할 수 없으며 호출 제한도 있습니다.
- 공개 웹사이트의 API 중계 주소는 타인이 호출할 수 있으므로 개인 분석용으로만 사용하고, 한도 초과 또는 키 오남용이 보이면 Worker Secret의 키를 교체하세요.
- 민감한 파일이나 URL을 외부 분석 서비스에 제출하기 전에 조직의 정책과 개인정보·기밀 포함 여부를 확인하세요.
- Worker 코드는 `worker/index.js`에서 관리합니다.
