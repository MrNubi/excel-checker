import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatValue } from "./utils/format";
import {
  Container, H1, P, Card, Row,
  Button, Badge, Timestamp,
  TableWrap, Table,
} from "./styles";

type RowData = Record<string, any>;
type LocationState = { rows?: RowData[] };

const CATEGORIES = ["일반", "영세", "중소1", "중소2", "중소3"] as const;
type Category = typeof CATEGORIES[number];

export default function NewCompaniesPage() {
  const { state } = useLocation() as { state: LocationState };
  const navigate = useNavigate();
  const rows = useMemo(() => state?.rows ?? [], [state]);

  // 구분 선택 상태
  const [categoryMap, setCategoryMap] = useState<Record<number, Category>>({});

  function onChangeCat(idx: number, v: Category) {
    setCategoryMap((prev) => ({ ...prev, [idx]: v }));
  }

  function onSubmit() {
    // 실제 서버에 전송할 페이로드 예시
    const payload = rows.map((r, i) => ({
      사업자번호: r["사업자번호"],
      상호: r["상호"],
      MID: r["MID"],
      GID: r["GID"],
      MID명: r["MID명"],
      지불수단: r["지불수단"],
      구분: categoryMap[i] ?? "일반",
    }));

    // TODO: 서버에 전송
    // fetch('/company/bulk-add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })


    alert(`기업추가 ${payload.length}건 제출 완료(콘솔 확인).`);
    navigate("/excel");
  }

  return (
    <Container>
      <H1>추가 대상 검토</H1>
      <P>아래 항목에 대해 우측 <b>구분</b>을 선택한 뒤, 제출하세요.</P>

      <Card>
        <Row>
          <Badge>대상 개수: {rows.length}</Badge>
          <Timestamp>{new Date().toLocaleString()}</Timestamp>
        </Row>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>#</th>
                <th>사업자번호</th><th>상호</th><th>MID</th><th>GID</th><th>MID명</th><th>지불수단</th>
                <th>구분</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 1000).map((r, i) => (
                <tr key={i}>
                  <td><code>{i + 1}</code></td>
                  <td>{formatValue(r["사업자번호"])}</td>
                  <td>{formatValue(r["상호"])}</td>
                  <td>{formatValue(r["MID"])}</td>
                  <td>{formatValue(r["GID"])}</td>
                  <td>{formatValue(r["MID명"])}</td>
                  <td>{formatValue(r["지불수단"])}</td>
                  <td>
                    <select
                      value={categoryMap[i] ?? "일반"}
                      onChange={(e) => onChangeCat(i, e.target.value as Category)}
                      style={{ fontSize: 12, padding: "4px 6px" }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        <Row style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <Button type="button" onClick={onSubmit}>제출</Button>
        </Row>
      </Card>
    </Container>
  );
}
