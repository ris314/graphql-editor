import * as React from "react";
import { SVGProps } from "react";
const SvgComponent = (props: SVGProps<SVGSVGElement>) => <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M12 2.22476V5.66688C12 6.13359 12 6.36694 12.0908 6.5452C12.1707 6.70201 12.2982 6.82949 12.455 6.90938C12.6333 7.00021 12.8666 7.00021 13.3333 7.00021H16.7754M12 2.00015H7C5.59987 2.00015 4.8998 2.00015 4.36502 2.27264C3.89462 2.51232 3.51217 2.89477 3.27248 3.36518C3 3.89996 3 4.60002 3 6.00015V14.0002C3 15.4003 3 16.1003 3.27248 16.6351C3.51217 17.1055 3.89462 17.488 4.36502 17.7277C4.8998 18.0002 5.59987 18.0002 7 18.0002H13C14.4001 18.0002 15.1002 18.0002 15.635 17.7277C16.1054 17.488 16.4878 17.1055 16.7275 16.6351C17 16.1003 17 15.4003 17 14.0002V7.00015L12 2.00015Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><path d="M12 12L10 10M10 10L8 12M10 10L10 15" stroke="#B7C7CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>;
export { SvgComponent as FileDownload };