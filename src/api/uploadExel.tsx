import type { CheckUnknownsResponse } from '../types/excel';
export async function checkUnknowns(file: File): Promise<CheckUnknownsResponse> {
const fd = new FormData();
fd.append('file', file);
const resp = await fetch('/excel/check-unknowns', { method: 'POST', body: fd });
const data = await resp.json();
if (!resp.ok) throw new Error(data?.error || '업로드 실패');
return data;
}
//s