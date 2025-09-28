import * as XLSX from "xlsx";
import type { CheckUnknownsResponse } from "../../../types/excel";

export type Row = Record<string, any>;
export type CompareResult = {
  totalA: number;   // 대상(A) 총 행
  totalB: number;   // 원본(B) 총 행
  matches: Row[];   // 키 일치
  onlyInA: Row[];   // A에만 있음
  onlyInB: Row[];   // B에만 있음
};

// ---------- Parsing ----------
export async function readXlsxInBrowser(file: File) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true, raw: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Row[] = XLSX.utils.sheet_to_json(ws, {
    defval: null,
    raw: true,
    blankrows: false,
  });
  return { sheet: wb.SheetNames[0], rows };
}

// ---------- Unknown-like detection & simple rules ----------
const UNKNOWN_STRINGS = new Set(["null", "undefined", "na", "n/a", "nan"]);
export function isUnknownLike(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === "number" && Number.isNaN(v)) return true;
  if (typeof v === "string") {
    const t = v.replace(/\u00A0/g, " ").trim();
    if (t === "") return true;
    if (/^-+$/.test(t)) return true; // '-', '--' 등
    if (UNKNOWN_STRINGS.has(t.toLowerCase())) return true;
  }
  return false;
}

const REQUIRED = ["정산월", "사업자번호", "상호", "MID", "금액"];
const ALLOWED_PAY = new Set(["신용카드", "계좌이체", "가상계좌", "해외카드"]);

export function validateRows(rows: Row[]) {
  const errors: Array<{ row: number; unknownFields: { field: string; value: any }[] }> = [];

  rows.forEach((r, i) => {
    const u: { field: string; value: any }[] = [];

// 필수값 (하이픈 '-' 불허)
REQUIRED.forEach((key) => {
  if (isUnknownLike(r[key])) u.push({ field: key, value: r[key] });
});

    // 허용값(지불수단)
    if (!isUnknownLike(r["지불수단"]) && !ALLOWED_PAY.has(String(r["지불수단"]))) {
      u.push({ field: "지불수단", value: r["지불수단"] });
    }

// 숫자 검증: 음수 허용, 숫자 아님만 에러
{
  const amount = Number(r["금액"]);
  if (!Number.isFinite(amount)) {
    u.push({ field: "금액", value: r["금액"] });
  }
}


    if (u.length) errors.push({ row: i + 2, unknownFields: u }); // 헤더 1행 가정
  });

  return { total: rows.length, unknown_rows: errors.length, errors };
}

export async function validateClientSide(file: File): Promise<CheckUnknownsResponse> {
  const { sheet, rows } = await readXlsxInBrowser(file);
  const { total, unknown_rows, errors } = validateRows(rows);
  return { ok: unknown_rows === 0, sheet, total, unknown_rows, errors };
}

// ---------- Composite-key compare (A: 대상, B: 원본) ----------
const PAYMAP: Record<string, string> = {
  "신용카드": "card",
  "카드": "card",
  "해외카드": "card_intl",
  "계좌이체": "transfer",
  "가상계좌": "virtual",
};

const normText = (v: any) => (v == null ? "" : String(v).replace(/\u00A0/g, " ").trim());
const normBizNo = (v: any) => normText(v).replace(/[^0-9]/g, "");
const normName = (v: any) => normText(v).toLowerCase();
const normId   = (v: any) => normText(v); // MID/GID는 문자열 그대로(공백 정리만)
const normPay  = (v: any) => {
  const base = normText(v).toLowerCase();
  return PAYMAP[base] ?? base;
};

export function toCompositeKey(row: Row): string {
  const 사업자번호 = normBizNo(row["사업자번호"]);
  const 상호     = normName(row["상호"]);
  const MID      = normId(row["MID"]);
  const GID      = normId(row["GID"]);
  const MID명    = normName(row["MID명"]);
  const 지불수단   = normPay(row["지불수단"]);
  return [사업자번호, 상호, MID, GID, MID명, 지불수단].join("|");
}

export async function compareClientSide(fileA: File, fileB: File): Promise<CompareResult> {
  const { rows: A } = await readXlsxInBrowser(fileA);
  const { rows: B } = await readXlsxInBrowser(fileB);
  return compareByCompositeKey(A, B);
}

export function compareByCompositeKey(A: Row[], B: Row[]): CompareResult {
  const mapA = new Map<string, Row>();
  const mapB = new Map<string, Row>();
  for (const r of A) mapA.set(toCompositeKey(r), r);
  for (const r of B) mapB.set(toCompositeKey(r), r);

  const matches: Row[] = [];
  const onlyInA: Row[] = [];
  const onlyInB: Row[] = [];

  for (const [k, r] of mapA) {
    if (mapB.has(k)) matches.push(r);
    else onlyInA.push(r);
  }
  for (const [k, r] of mapB) {
    if (!mapA.has(k)) onlyInB.push(r);
  }

  return { totalA: A.length, totalB: B.length, matches, onlyInA, onlyInB };
}