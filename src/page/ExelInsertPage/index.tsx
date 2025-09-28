import React, { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { checkUnknowns } from '../../api/uploadExel';
import type { CheckUnknownsResponse, UnknownRow } from '../../types/excel';
import { formatValue } from "./utils/format";

const Container = styled.div`
  max-width: 1000px; margin: 0 auto; padding: 32px 16px;
`;
const H1 = styled.h1` font-size:22px; font-weight:700; margin:0 0 8px; `;
const P  = styled.p` font-size:13px; color:${({ theme }) => theme.colors.muted}; margin:0 0 16px; `;
const Card = styled.div`
  background:${({ theme }) => theme.colors.card};
  border:1px solid ${({ theme }) => theme.colors.border};
  border-radius:${({ theme }) => theme.radius.lg};
  padding:16px;
`;
const Row = styled.div` display:flex; gap:8px; flex-wrap:wrap; align-items:center; `;
const HiddenFile = styled.input` display:none; `;

// v6 OK: 공통 버튼 스타일
const btnBase = css<{$ghost?: boolean}>`
  appearance:none;
  border:1px solid ${({ theme }) => theme.colors.border};
  background:${({ $ghost, theme }) => $ghost ? "#f0f1f3" : theme.colors.btn};
  color:${({ $ghost }) => $ghost ? "#222" : "#fff"};
  padding:8px 12px;
  border-radius:${({ theme }) => theme.radius.md};
  font-size:13px;
  cursor:pointer;
  &:hover { opacity:.9; }
  &:disabled { opacity:.5; cursor:not-allowed; }
`;

const Button = styled.button<{$ghost?: boolean}>`${btnBase}`;
const LabelButton = styled.label<{$ghost?: boolean}>`${btnBase}`;

// ⚠️ 여기 수정: 제네릭 인라인 대신 별도 타입 + transient prop 사용
type BadgeIntent = "ok" | "warn" | "default";
interface BadgeProps { $intent?: BadgeIntent; }

const Badge = styled.span<BadgeProps>`
  display:inline-block; padding:4px 8px; font-size:12px;
  border:1px solid ${({ theme }) => theme.colors.border};
  border-radius:${({ theme }) => theme.radius.md};
  background:#fff; color:#222;

  ${({ $intent, theme }) =>
    $intent === "ok"
      ? `background:#ecf7ef;border-color:#d7ecd9;color:${theme.colors.ok};`
      : $intent === "warn"
      ? `background:#fff7e6;border-color:#ffe0b2;color:${theme.colors.warn};`
      : ""}
`;

const Timestamp = styled.span`
  margin-left:auto; font-size:12px; color:${({ theme }) => theme.colors.muted};
`;
const AlertOk = styled.div`
  margin-top:16px; padding:10px 12px; border-radius:${({ theme }) => theme.radius.md};
  font-size:13px; border:1px solid #d7ecd9; background:#ecf7ef; color:${({ theme }) => theme.colors.ok};
`;
const TableWrap = styled.div`
  margin-top:16px; overflow:auto; background:#fff;
  border:1px solid ${({ theme }) => theme.colors.border};
  border-radius:${({ theme }) => theme.radius.lg};
`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:13px;
  thead th {
    text-align:left; padding:10px 12px; background:#f5f6f8;
    border-bottom:1px solid ${({ theme }) => theme.colors.border};
    position:sticky; top:0;
  }
  td { padding:10px 12px; border-top:1px solid ${({ theme }) => theme.colors.border}; vertical-align:top; }
`;
const Code = styled.code`
  background:#f8f9fa; border:1px solid ${({ theme }) => theme.colors.border};
  border-radius:${({ theme }) => theme.radius.sm};
  padding:2px 4px; display:inline-block; word-break:break-all;
`;

export default function ExcelInsertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckUnknownsResponse | null>(null);
  const [status, setStatus] = useState("");

  async function onUpload() {
    if (!file) { setError("먼저 파일을 선택하세요."); return; }
    try {
      setIsLoading(true); setError(null); setResult(null); setStatus("업로드/검사 중...");
      const data = await checkUnknowns(file);
      setResult(data);
      setStatus(data.unknown_rows && data.unknown_rows > 0
        ? `Unknown 값 발견: ${data.unknown_rows}개 행`
        : "모든 행 정상");
    } catch (e: any) {
      setError(e?.message || "알 수 없는 오류"); setStatus("");
    } finally {
      setIsLoading(false);
    }
  }

  const errors: UnknownRow[] = useMemo(() => result?.errors ?? [], [result]);

  return (
    <Container>
      <H1>엑셀 Unknown 값 검사기</H1>
      <P>
        .xlsx 업로드 후 각 행에서 <strong>null/undefined/빈칸/NA/NAN/하이픈</strong> 등
        "사실상 알 수 없는 값"을 찾아 표시합니다.
      </P>

      <Card>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 8 }}>파일을 선택하세요</div>
          <Row style={{ justifyContent: "center" }}>
            <LabelButton>
              <HiddenFile
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              파일 선택 (.xlsx)
            </LabelButton>
            <Button onClick={onUpload} disabled={!file || isLoading}>
              {isLoading ? "검사 중…" : "검사 시작"}
            </Button>
            <Button $ghost onClick={() => { setFile(null); setResult(null); setError(null); setStatus(""); }}>
              리셋
            </Button>
          </Row>
          {file && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              선택됨: <b>{file.name}</b> ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
          {status && <div style={{ marginTop: 8, fontSize: 12 }}>{status}</div>}
          {error && <div style={{ marginTop: 8, fontSize: 12, color: "#b00020" }}>{error}</div>}
        </div>
      </Card>

      {result && (
        <Card style={{ marginTop: 24 }}>
          <Row>
            <Badge>시트: {result.sheet ?? "-"}</Badge>
            <Badge>총 행: {result.total ?? 0}</Badge>
            <Badge $intent={(result.unknown_rows ?? 0) > 0 ? "warn" : "ok"}>
              Unknown 행: {result.unknown_rows ?? 0}
            </Badge>
            {result.headerWarning?.missingHeaders && (
              <Badge $intent="warn">
                헤더 누락: {result.headerWarning.missingHeaders.join(", ")}
              </Badge>
            )}
            <Timestamp>{new Date().toLocaleString()}</Timestamp>
          </Row>

          {errors.length === 0 ? (
            <AlertOk>모든 행에서 unknown-like 값이 발견되지 않았습니다. ✅</AlertOk>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>행 번호</th>
                    <th>필드</th>
                    <th>원본 값</th>
                  </tr>
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
    </Container>
  );
}