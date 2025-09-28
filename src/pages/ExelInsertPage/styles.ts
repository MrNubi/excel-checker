import styled, { css } from "styled-components";

/** Layout */
export const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 16px;
`;

export const H1 = styled.h1`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
`;

export const P = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.muted};
  margin: 0 0 16px;
`;

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 16px;
`;

export const Row = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

export const HiddenFile = styled.input`
  display: none;
`;

/** Buttons */
const btnBase = css<{$ghost?: boolean}>`
  appearance: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $ghost, theme }) => ($ghost ? "#f0f1f3" : theme.colors.btn)};
  color: ${({ $ghost }) => ($ghost ? "#222" : "#fff")};
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 13px;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const Button = styled.button<{$ghost?: boolean}>`${btnBase}`;
export const LabelButton = styled.label<{$ghost?: boolean}>`${btnBase}`;

/** Badges */
type BadgeIntent = "ok" | "warn" | "default";
interface BadgeProps { $intent?: BadgeIntent; }

export const Badge = styled.span<BadgeProps>`
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: #fff;
  color: #222;

  ${({ $intent, theme }) =>
    $intent === "ok"
      ? `background:#ecf7ef;border-color:#d7ecd9;color:${theme.colors.ok};`
      : ""}

  ${({ $intent, theme }) =>
    $intent === "warn"
      ? `background:#fff7e6;border-color:#ffe0b2;color:${theme.colors.warn};`
      : ""}
`;

export const Timestamp = styled.span`
  margin-left: auto;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.muted};
`;

export const AlertOk = styled.div`
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 13px;
  border: 1px solid #d7ecd9;
  background: #ecf7ef;
  color: ${({ theme }) => theme.colors.ok};
`;

/** Table */
export const TableWrap = styled.div`
  margin-top: 16px;
  overflow: auto;
  background: #fff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead th {
    text-align: left;
    padding: 10px 12px;
    background: #f5f6f8;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    position: sticky;
    top: 0;
  }

  td {
    padding: 10px 12px;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    vertical-align: top;
  }
`;

export const Code = styled.code`
  background: #f8f9fa;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 2px 4px;
  display: inline-block;
  word-break: break-all;
`;
