import React, { useMemo, useState } from "react";
import styled, { css } from "styled-components";
import type { CheckUnknownsResponse, UnknownRow } from "../../types/excel";
import { formatValue } from "./utils/format";
import { validateClientSide, compareClientSide, type CompareResult } from "./utils/xlsx";

const Container = styled.div` max-width:1000px; margin:0 auto; padding:32px 16px; `;
const H1 = styled.h1` font-size:22px; font-weight:700; margin:0 0 8px; `;
const P  = styled.p` font-size:13px; color:${({theme})=>theme.colors.muted}; margin:0 0 16px; `;
const Card = styled.div`
  background:${({theme})=>theme.colors.card};
  border:1px solid ${({theme})=>theme.colors.border};
  border-radius:${({theme})=>theme.radius.lg}; padding:16px;`;
const Row = styled.div` display:flex; gap:8px; flex-wrap:wrap; align-items:center; `;
const HiddenFile = styled.input` display:none; `;

const btnBase = css<{$ghost?: boolean}>`
  appearance:none; border:1px solid ${({theme})=>theme.colors.border};
  background:${({$ghost,theme})=>$ghost? '#f0f1f3': theme.colors.btn};
  color:${({$ghost})=>$ghost? '#222': '#fff'}; padding:8px 12px;
  border-radius:${({theme})=>theme.radius.md}; font-size:13px; cursor:pointer;
  &:hover{ opacity:.9; } &:disabled{ opacity:.5; cursor:not-allowed; }
`;
const Button = styled.button<{$ghost?: boolean}>`${btnBase}`;
const LabelButton = styled.label<{$ghost?: boolean}>`${btnBase}`;

type BadgeIntent = 'ok'|'warn'|'default';
interface BadgeProps { $intent?: BadgeIntent }
const Badge = styled.span<BadgeProps>`
  display:inline-block; padding:4px 8px; font-size:12px;
  border:1px solid ${({theme})=>theme.colors.border}; border-radius:${({theme})=>theme.radius.md};
  background:#fff; color:#222;
  ${({$intent,theme})=>$intent==='ok'?`background:#ecf7ef;border-color:#d7ecd9;color:${theme.colors.ok};`:''}
  ${({$intent,theme})=>$intent==='warn'?`background:#fff7e6;border-color:#ffe0b2;color:${theme.colors.warn};`:''}
`;
const Timestamp = styled.span` margin-left:auto; font-size:12px; color:${({theme})=>theme.colors.muted}; `;
const AlertOk = styled.div`
  margin-top:16px; padding:10px 12px; border-radius:${({theme})=>theme.radius.md};
  font-size:13px; border:1px solid #d7ecd9; background:#ecf7ef; color:${({theme})=>theme.colors.ok};`;
const TableWrap = styled.div`
  margin-top:16px; overflow:auto; background:#fff; border:1px solid ${({theme})=>theme.colors.border}; border-radius:${({theme})=>theme.radius.lg};`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:13px;
  thead th{ text-align:left; padding:10px 12px; background:#f5f6f8; border-bottom:1px solid ${({theme})=>theme.colors.border}; position:sticky; top:0; }
  td{ padding:10px 12px; border-top:1px solid ${({theme})=>theme.colors.border}; vertical-align:top; }
`;
const Code = styled.code`
  background:#f8f9fa; border:1px solid ${({theme})=>theme.colors.border}; border-radius:${({theme})=>theme.radius.sm}; padding:2px 4px; display:inline-block; word-break:break-all;`;

export default function ExcelInsertPage(){
  const [file, setFile] = useState<File | null>(null);      // 비교 대상 A
  const [refFile, setRefFile] = useState<File | null>(null); // 원본 B

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckUnknownsResponse | null>(null); // Step1 결과
  const [cmp, setCmp] = useState<CompareResult | null>(null);              // Step2 결과
  const [status, setStatus] = useState("");

  async function onValidate(){
    if(!file){ setError('먼저 비교 대상 파일을 선택하세요.'); return; }
    try{
      setIsLoading(true); setError(null); setResult(null); setCmp(null); setStatus('로컬 검증 중...');
      const local = await validateClientSide(file);
      setResult(local);
      setStatus(local.unknown_rows && local.unknown_rows>0 ? `Unknown 값 발견: ${local.unknown_rows}개 행` : '로컬 검증 통과');
    }catch(e:any){ setError(e?.message || '검증 중 오류'); setStatus(''); }
    finally{ setIsLoading(false); }
  }

  async function onCompare(){
    if(!file || !refFile){ setError('비교 대상/원본 파일을 모두 선택하세요.'); return; }
    try{
      setIsLoading(true); setError(null); setStatus('비교 중...');
      const result = await compareClientSide(file, refFile);
      setCmp(result);
      setStatus('비교 완료');
    }catch(e:any){ setError(e?.message || '비교 중 오류'); setStatus(''); }
    finally{ setIsLoading(false); }
  }

  const errors: UnknownRow[] = useMemo(()=> result?.errors ?? [], [result]);

  return (
    <Container>
      <H1>엑셀 Unknown 검사 & 원본 비교</H1>
      <P>1단계: 로컬에서 빈값/형식 간단 검사 → 2단계: 원본과 복합키(사업자번호/상호/MID/GID/MID명/지불수단)로 비교</P>

      <Card>
        <div style={{textAlign:'center'}}>
          <div style={{marginBottom:8}}>두 파일을 선택하세요</div>
          <Row style={{justifyContent:'center'}}>
            <LabelButton>
              <HiddenFile type="file" accept=".xlsx" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
              비교 대상 (.xlsx)
            </LabelButton>
            <LabelButton $ghost>
              <HiddenFile type="file" accept=".xlsx" onChange={(e)=>setRefFile(e.target.files?.[0] ?? null)} />
              원본 (.xlsx)
            </LabelButton>
            <Button type="button" onClick={onValidate} disabled={!file || isLoading}>
              {isLoading ? '검사 중…' : '1단계(로컬 검증)'}
            </Button>
            <Button type="button" onClick={onCompare} disabled={!file || !refFile || isLoading}>
              {isLoading ? '비교 중…' : '2단계(원본 비교)'}
            </Button>
            <Button type="button" $ghost onClick={()=>{ setFile(null); setRefFile(null); setResult(null); setCmp(null); setError(null); setStatus(''); }}>리셋</Button>
          </Row>
          <div style={{marginTop:8, fontSize:12}}>
            {file && <>대상: <b>{file.name}</b></>} {refFile && <> / 원본: <b>{refFile.name}</b></>}
          </div>
          {status && <div style={{marginTop:8, fontSize:12}}>{status}</div>}
          {error && <div style={{marginTop:8, fontSize:12, color:'#b00020'}}>{error}</div>}
        </div>
      </Card>

      {/* Step 1 결과 */}
      {result && (
        <Card style={{marginTop:24}}>
          <Row>
            <Badge>시트: {result.sheet ?? '-'}</Badge>
            <Badge>총 행: {result.total ?? 0}</Badge>
            <Badge $intent={(result.unknown_rows??0)>0?'warn':'ok'}>Unknown 행: {result.unknown_rows ?? 0}</Badge>
            <Timestamp>{new Date().toLocaleString()}</Timestamp>
          </Row>

          {(errors.length===0) ? (
            <AlertOk>모든 행에서 unknown-like 값이 발견되지 않았습니다. ✅</AlertOk>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr><th>행 번호</th><th>필드</th><th>원본 값</th></tr>
                </thead>
                <tbody>
                  {errors.slice(0,200).map((e,i)=> (
                    <tr key={i}>
                      <td><code>{e.row}</code></td>
                      <td>
                        <ul style={{margin:0, paddingLeft:16}}>
                          {e.unknownFields?.map((f,idx)=> (<li key={idx}><strong>{f.field}</strong></li>))}
                        </ul>
                      </td>
                      <td>
                        <ul style={{margin:0, paddingLeft:16}}>
                          {e.unknownFields?.map((f,idx)=> (<li key={idx}><Code>{formatValue(f.value)}</Code></li>))}
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

      {/* Step 2 결과 */}
      {cmp && (
        <Card style={{marginTop:24}}>
          <Row>
            <Badge>대상(A) 행: {cmp.totalA}</Badge>
            <Badge>원본(B) 행: {cmp.totalB}</Badge>
            <Badge $intent="ok">일치: {cmp.matches.length}</Badge>
            <Badge $intent={cmp.onlyInA.length? 'warn':'ok'}>A만 있음: {cmp.onlyInA.length}</Badge>
            <Badge $intent={cmp.onlyInB.length? 'warn':'ok'}>B만 있음: {cmp.onlyInB.length}</Badge>
            <Timestamp>{new Date().toLocaleString()}</Timestamp>
          </Row>

          {cmp.onlyInA.length>0 && (
            <>
              <H1 style={{fontSize:16, marginTop:16}}>A에만 있는 행(원본과 키 불일치)</H1>
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>#(추정)</th><th>사업자번호</th><th>상호</th><th>MID</th><th>GID</th><th>MID명</th><th>지불수단</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmp.onlyInA.slice(0,200).map((r,i)=> (
                      <tr key={i}>
                        <td><code>{i+2}</code></td>
                        <td>{r["사업자번호"]}</td><td>{r["상호"]}</td><td>{r["MID"]}</td>
                        <td>{r["GID"]}</td><td>{r["MID명"]}</td><td>{r["지불수단"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </>
          )}

          {cmp.onlyInB.length>0 && (
            <>
              <H1 style={{fontSize:16, marginTop:16}}>B(원본)에만 있는 행(A와 키 불일치)</H1>
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <th>#</th><th>사업자번호</th><th>상호</th><th>MID</th><th>GID</th><th>MID명</th><th>지불수단</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmp.onlyInB.slice(0,200).map((r,i)=> (
                      <tr key={i}>
                        <td><code>{i+2}</code></td>
                        <td>{r["사업자번호"]}</td><td>{r["상호"]}</td><td>{r["MID"]}</td>
                        <td>{r["GID"]}</td><td>{r["MID명"]}</td><td>{r["지불수단"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </>
          )}
        </Card>
      )}
    </Container>
  );
}
