# TPIS Landing

TPIS 랜딩 페이지용 Vite + React + TypeScript 프로젝트입니다.

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 문의하기 설정

Google Apps Script를 웹앱으로 배포한 뒤 `.env` 파일에 아래 값을 입력하면 문의 폼이 전송됩니다.

```bash
VITE_CONTACT_SCRIPT_URL=https://script.google.com/macros/s/배포_ID/exec
```

Apps Script 쪽에서는 `name`, `contact`, `message` 필드를 받도록 구성하면 됩니다.
