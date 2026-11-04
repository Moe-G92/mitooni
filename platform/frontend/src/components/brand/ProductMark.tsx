import type { CSSProperties } from "react";
export function ProductLogo({ title, className, style }: { title?: string; className?: string; style?: CSSProperties }) { return <span aria-label={title} className={className} style={{ ...style, fontSize: "1.65rem", fontWeight: 750, lineHeight: 1.25 }}>میتونی</span>; }
export function ProductMark(props: Parameters<typeof ProductLogo>[0]) { return <span aria-hidden="true" className={props.className} style={{...props.style,fontSize:"1.2rem",fontWeight:750,lineHeight:1.5}}>می</span>; }
