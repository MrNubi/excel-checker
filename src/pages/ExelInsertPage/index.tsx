import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CheckUnknownsResponse, UnknownRow } from "../../types/excel";
import { formatValue } from "./utils/format";
import {
  validateClientSide,
  compareClientSide,
  type CompareResult,
} from "./utils/xlsx";

// 스타일 분리본
import {
  Container, H1, P, Card, Row,
  HiddenFile, Button, LabelButton,
  Badge, Timestamp, AlertOk,
  TableWrap, Table, Code,
} from "./styles";
// ExcelTest
// 상태 셀렉트 라벨
const ACTION_LABEL: Record<"pass"|"add"|"blacklist", string> = {
  pass: "패스",
  add: "기업추가",
  blacklist: "블랙리스트",
};

export default function ExcelInsertPage() {
  const navigate = useNavigate();

  // 파일: A=비교 대상, B=원본
  const [file, setFile] = useState<File | null>(null);
  const [refFile, setRefFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // 결과
  const [result, setResult] = useState<CheckUnknownsResponse | null>(null); // Step1
  const [cmp, setCmp] = useState<CompareResult | null>(null);               // Step2
  const errors: UnknownRow[] = useMemo(() => result?.errors ?? [], [result]);

  // 각 행 상태 선택 저장 (키: compositeKey, 값: 'pass'|'add'|'blacklist')
  const [rowActions, setRowActions] = useState<Record<string, "pass"|"add"|"blacklist">>({});

  // composite key 생성 (xlsx util의 toCompositeKey를 써도 되지만,
  // 이 페이지에서는 서버 의존 없이 키를 만들기 위해 동일 로직을 간단 재구현)
  const keyOf = (r: Record<string, any>) => {
    const norm = (v: any) => (v == null ? "" : String(v).replace(/\u00A0/g, " ").trim());
    const normBiz = (v: any) => norm(v).replace(/[^0-9]/g, "");
    const lower = (v: any) => norm(v).toLowerCase();
    const payCanon = (v: any) => {
      const base = lower(v);
      if (base === "신용카드" || base === "카드") return "card";
      if (base === "해외카드") return "card_intl";
      if (base === "계좌이체") return "transfer";
      if (base === "가상계좌") return "virtual";
      return base;
    };
    return [
      normBiz(r["사업자번호"]),
      lower(r["상호"]),
      norm(r["MID"]),
      norm(r["GID"]),
      lower(r["MID명"]),
      payCanon(r["지불수단"]),
    ].join("|");
  };

  async function onValidate() {
    if (!file) { setError("먼저 비교 대상 파일을 선택하세요."); return; }
    try {
      setIsLoading(true); setError(null); setResult(null); setCmp(null);
      setRowActions({});
      setStatus("로컬 검증 중... (금액은 음수 허용, 하이픈 '-' 불가)");
      const local = await validateClientSide(file);
      setResult(local);
      setStatus(local.unknown_rows && local.unknown_rows > 0
        ? `Unknown 값 발견: ${local.unknown_rows}개 행`
        : "로컬 검증 통과");
    } catch (e: any) {
      setError(e?.message || "검증 중 오류");
      setStatus("");
    } finally { setIsLoading(false); }
  }

  async function onCompare() {
    if (!file || !refFile) { setError("비교 대상/원본 파일을 모두 선택하세요."); return; }
    try {
      setIsLoading(true); setError(null); setStatus("원본과 비교 중...");
      const r = await compareClientSide(file, refFile);
      setCmp(r);
      setStatus("비교 완료");
      setRowActions({}); // 비교할 때마다 초기화
    } catch (e: any) {
      setError(e?.message || "비교 중 오류");
      setStatus("");
    } finally { setIsLoading(false); }
  }

  function onReset() {
    setFile(null); setRefFile(null);
    setResult(null); setCmp(null);
    setRowActions({});
    setError(null); setStatus("");
  }

  // 제출: 블랙리스트 제외, 기업추가만 새 페이지로 이동
  function onSubmitSelected() {
    if (!cmp) return;

    const onlyA = cmp.onlyInA ?? [];
    const notBlacklisted = onlyA.filter(r => (rowActions[keyOf(r)] ?? "pass") !== "blacklist");
    const toAdd = onlyA.filter(r => (rowActions[keyOf(r)] ?? "pass") === "add");

    // 현재 화면에서 블랙리스트 제거
    setCmp({
      ...cmp,
      onlyInA: notBlacklisted,
    });

    // 기업추가 선택된 항목을 새 페이지로 전달
    navigate("/excel/new", { state: { rows: toAdd } });
  }

  return (
    <Container>
      <H1>엑셀 Unknown 검사 & 원본 비교</H1>
      <P>
        1단계: 로컬에서 빈값/형식 간단 검사(
        <b>금액은 음수 허용, 하이픈 '-' 불가</b>) →
        2단계: 원본과 복합키(사업자번호/상호/MID/GID/MID명/지불수단[해외카드 포함])로 비교
      </P>

      {/* 업로더 & 액션 */}
      <Card>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 8 }}>두 파일을 선택하세요</div>
          <Row style={{ justifyContent: "center" }}>
            <LabelButton>
              <HiddenFile
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              비교 대상 (.xlsx)
            </LabelButton>
            <LabelButton $ghost>
              <HiddenFile
                type="file"
                accept=".xlsx"
                onChange={(e) => setRefFile(e.target.files?.[0] ?? null)}
              />
              원본 (.xlsx)
            </LabelButton>
            <Button type="button" onClick={onValidate} disabled={!file || isLoading}>
              {isLoading ? "검사 중…" : "1단계(로컬 검증)"}
            </Button>
            <Button type="button" onClick={onCompare} disabled={!file || !refFile || isLoading}>
              {isLoading ? "비교 중…" : "2단계(원본 비교)"}
            </Button>
            <Button type="button" $ghost onClick={onReset}>리셋</Button>
          </Row>

          <div style={{ marginTop: 8, fontSize: 12 }}>
            {file && <>대상: <b>{file.name}</b></>}
            {refFile && <> / 원본: <b>{refFile.name}</b></>}
          </div>
          {status && <div style={{ marginTop: 8, fontSize: 12 }}>{status}</div>}
          {error && <div style={{ marginTop: 8, fontSize: 12, color: "#b00020" }}>{error}</div>}
        </div>
      </Card>

      {/* Step 1 결과 */}
      {result && (
        <Card style={{ marginTop: 24 }}>
          <Row>
            <Badge>시트: {result.sheet ?? "-"}</Badge>
            <Badge>총 행: {result.total ?? 0}</Badge>
            <Badge $intent={(result.unknown_rows ?? 0) > 0 ? "warn" : "ok"}>
              Unknown 행: {result.unknown_rows ?? 0}
            </Badge>
            <Timestamp>{new Date().toLocaleString()}</Timestamp>
          </Row>

          {errors.length === 0 ? (
            <AlertOk>모든 행에서 unknown-like 값이 발견되지 않았습니다. ✅</AlertOk>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr><th>행 번호</th><th>필드</th><th>원본 값</th></tr>
                </thead>
                <tbody>
                  {errors.slice(0, 200).map((e, i) => (
                    <tr key={i}>
                      <td><code>{e.row}</code></td>
                      <td>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {e.unknownFields?.map((f, idx) => (
                            <li key={idx}><strong>{f.field}</strong></li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {e.unknownFields?.map((f, idx) => (
                            <li key={idx}><Code>{formatValue(f.value)}</Code></li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>
      )}

      {/* Step 2 결과 (B만 있는 행 섹션 제거) */}
      {cmp && (
        <Card style={{ marginTop: 24 }}>
          <Row>
            <Badge>대상(A) 행: {cmp.totalA}</Badge>
            <Badge>원본(B) 행: {cmp.totalB}</Badge>
            <Badge $intent="ok">일치: {cmp.matches.length}</Badge>
            <Badge $intent={cmp.onlyInA.length ? "warn" : "ok"}>검사 결과: {cmp.onlyInA.length}</Badge>
            <Timestamp>{new Date().toLocaleString()}</Timestamp>
          </Row>

          {/* A에만 있는 행 + 상태 선택 */}
          {cmp.onlyInA.length > 0 && (
            <>
              <H1 style={{ fontSize: 16, marginTop: 16 }}>A에만 있는 행(원본과 키 불일치)</H1>
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>상태</th>
                      <th>#(추정)</th>
                      <th>사업자번호</th><th>상호</th><th>MID</th><th>GID</th><th>MID명</th><th>지불수단</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmp.onlyInA.slice(0, 500).map((r, i) => {
                      const key = keyOf(r);
                      const value = rowActions[key] ?? "pass";
                      return (
                        <tr key={key}>
                          <td>
                            <select
                              value={value}
                              onChange={(e) =>
                                setRowActions((prev) => ({ ...prev, [key]: e.target.value as "pass"|"add"|"blacklist" }))
                              }
                              style={{ fontSize: 12, padding: "4px 6px" }}
                            >
                              <option value="blacklist">{ACTION_LABEL.blacklist}</option>
                              <option value="add">{ACTION_LABEL.add}</option>
                              <option value="pass">{ACTION_LABEL.pass}</option>
                            </select>
                          </td>
                          <td><code>{i + 2}</code></td>
                          <td>{formatValue(r["사업자번호"])}</td>
                          <td>{formatValue(r["상호"])}</td>
                          <td>{formatValue(r["MID"])}</td>
                          <td>{formatValue(r["GID"])}</td>
                          <td>{formatValue(r["MID명"])}</td>
                          <td>{formatValue(r["지불수단"])}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>

              <Row style={{ justifyContent: "flex-end", marginTop: 12 }}>
                <Button type="button" onClick={onSubmitSelected}>
                  선택 제출
                </Button>
              </Row>
            </>
          )}
        </Card>
      )}
    </Container>
  );
}
