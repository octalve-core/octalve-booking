/** Defensive import validation. No imported row becomes a confirmed booking without
 * the same server-side availability, owner acceptance and tenancy checks. */
export type ImportSource='calendly_csv'|'cal_com_csv'|'ics';
export function validateImportMetadata(filename:string,size:number,source:ImportSource):boolean{
 if(typeof filename!=='string'||filename.length<5||filename.length>180||/[\\/\0\r\n]/.test(filename))return false;
 if(!Number.isSafeInteger(size)||size<1||size>5*1024*1024)return false;
 if(source==='ics')return /\.ics$/i.test(filename);
 return /\.csv$/i.test(filename);
}
export function containsExecutableSpreadsheetCell(value:string):boolean{
 const text=value.replace(/^\s+/,'');
 return /^[=+@\-]/.test(text)||/\t|\r|\n/.test(value);
}
export function escapeSpreadsheetCell(value:string):string{
 return containsExecutableSpreadsheetCell(value)?"'"+value:value;
}
