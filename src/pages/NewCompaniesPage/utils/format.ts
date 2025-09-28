export function formatValue(v: any) {
  try {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';

    // Date 객체 처리(유효성 검사 포함)
    if (v instanceof Date) {
      const t = v.getTime();
      if (Number.isFinite(t)) {
        return new Intl.DateTimeFormat('ko-KR').format(v);
      }
      return '(유효하지 않은 날짜)';
    }

    // 빈 문자열 표시
    if (typeof v === 'string' && v.trim() === '') return '(빈문자열)';

    // 객체는 JSON으로
    if (typeof v === 'object') return JSON.stringify(v);

    // 숫자/불리언/그 외
    return String(v);
  } catch {
    // 혹시 모를 예외는 안전하게 문자열화
    return String(v);
  }
}