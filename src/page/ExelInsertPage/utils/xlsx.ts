import * as XLSX from "xlsx";
import type { CheckUnknownsResponse } from "../../../types/excel";

// 브라우저에서 File → rows[]
export async function readXlsxInBrowser(file: File) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true, raw: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
    defval: null, raw: true, blankrows: false,
  });
  return { sheet: wb.SheetNames[0], rows };
}

// unknown-like 판별
const UNKNOWN_STRINGS = new Set(["null", "undefined", "na", "n/a", "nan"]);
export function isUnknownLike(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === "number" && Number.isNaN(v)) return true;
  if (typeof v === "string") {
    const t = v.replace(/\u00A0/g, " ").trim();
    if (t === "") return true;
    if (/^-+$/.test(t)) return true;
    if (UNKNOWN_STRINGS.has(t.toLowerCase())) return true;
  }
  return false;
}

// 예시 규칙: 필수/허용/숫자
const REQUIRED = ["정산월","사업자번호","상호","MID","금액"];
const ALLOWED_PAY = new Set(["신용카드","계좌이체","가상계좌"]);

export function validateRows(rows: Record<string, any>[]) {
  const errors: Array<{ row: number; unknownFields: { field: string; value: any }[] }> = [];
  rows.forEach((r, i) => {
    const u: { field: string; value: any }[] = [];

    REQUIRED.forEach((key) => {
      if (isUnknownLike(r[key])) u.push({ field: key, value: r[key] });
    });

    if (!isUnknownLike(r["지불수단"]) && !ALLOWED_PAY.has(String(r["지불수단"]))) {
      u.push({ field: "지불수단", value: r["지불수단"] });
    }

    const amount = Number(r["금액"]);
    if (!Number.isFinite(amount) || amount < 0) {
      u.push({ field: "금액", value: r["금액"] });
    }

    if (u.length) errors.push({ row: i + 2, unknownFields: u }); // 헤더 1행 가정
  });
  return { total: rows.length, unknown_rows: errors.length, errors };
}

// 클라 1차 검증 결과를 서버 응답 포맷과 맞춤
export async function validateClientSide(file: File): Promise<CheckUnknownsResponse> {
  const { sheet, rows } = await readXlsxInBrowser(file);
  const { total, unknown_rows, errors } = validateRows(rows);
  return { ok: unknown_rows === 0, sheet, total, unknown_rows, errors };
}
