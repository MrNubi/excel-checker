export type UnknownField = { field: string; value: any };
export type UnknownRow = { row: number; unknownFields: UnknownField[] };
export type CheckUnknownsResponse = {
ok: boolean;
sheet?: string;
total?: number;
unknown_rows?: number;
errors?: UnknownRow[];
headerWarning?: { missingHeaders: string[] };
};