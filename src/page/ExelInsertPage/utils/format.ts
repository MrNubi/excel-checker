export function formatValue(v: any) {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (v instanceof Date) {
    // 날짜는 한국 로케일로 표시 (원하면 포맷 바꿔도 OK)
    return new Intl.DateTimeFormat('ko-KR').format(v);
  }
  if (typeof v === 'string' && v.trim() === '') return '(빈문자열)';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}