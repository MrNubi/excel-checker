export function formatValue(v: any){
if (v === null) return 'null';
if (v === undefined) return 'undefined';
if (typeof v === 'string' && v.trim() === '') return '(빈문자열)';
return String(v);
}