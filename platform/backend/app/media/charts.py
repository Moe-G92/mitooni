"""Deterministic SVG from typed data, with no executable or remote SVG content."""
from html import escape
import textwrap
from math import hypot
from app.media.contracts import VisualSpec

RENDERER_VERSION = 'mitooni-media-1'
COLORS = ['#195f7c','#a44724','#444b57','#6054a0','#256b47']

def number(v):
    return f'{v:,.0f}' if float(v).is_integer() else f'{v:,.2f}'.rstrip('0').rstrip('.')

def raw_alt(spec: VisualSpec) -> str:
    """Values/stages only: no answer overview, inferred trend or teacher guidance."""
    if spec.data:
        d=spec.data
        return f'{spec.title}. Unit: {d.unit}. ' + ' '.join(f'{s.label}: '+ '; '.join(f'{c}: {number(v)}' for c,v in zip(d.categories,s.values,strict=True))+'.' for s in d.series)+' '+' '.join(d.footnotes)
    return spec.title+'. '+' '.join(f'{s.order}. {s.action}. {s.materialBefore} → {s.materialAfter}.' + (f' Inputs: {", ".join(s.inputs)}.' if s.inputs else '') + (f' Removed: {", ".join(s.removals)}.' if s.removals else '') for s in spec.process.stages)+' '+' '.join(spec.process.footnotes)

def render_svg(spec: VisualSpec, width: int=1280) -> bytes:
    if width not in {360,768,1280}:
        raise ValueError('Supported widths: 360, 768, 1280')
    # Responsive layout changes row height/line wrapping, not merely image scaling.
    font=16 if width==360 else 20
    pad=24 if width==360 else 44
    out=[]
    def text(x,y,value,size=font,weight='400',anchor='start'):
        out.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{escape(str(value))}</text>')
    def wrapped(x,y,value,maxchars,size=font,weight='400'):
        lines=textwrap.wrap(str(value),width=max(10,maxchars)) or ['']
        for i,line in enumerate(lines):text(x,y+i*(size+7),line,size,weight)
        return y+len(lines)*(size+7)
    titleend=wrapped(pad,36,spec.title,(width-2*pad)//(font//2+1),font+3,'600')
    y=titleend+28
    if spec.data and spec.kind=='table':
        d=spec.data
        y=wrapped(pad,y,'Unit: '+d.unit,80)+16
        first=(width-2*pad)*.43
        col=(width-2*pad-first)/len(d.categories)
        text(pad+10,y,d.seriesLabel,font,'600')
        for i,c in enumerate(d.categories):text(pad+first+col*(i+.5),y,c,font,'600','middle')
        y+=20
        for i,s in enumerate(d.series):
            lines=textwrap.wrap(s.label,max(10,int(first/(font*.55))))
            rh=max(58,len(lines)*(font+7)+26)
            out.append(f'<rect x="{pad}" y="{y}" width="{width-2*pad}" height="{rh}" fill="{"#eef3f5" if i%2==0 else "#ffffff"}"/>')
            wrapped(pad+10,y+font+14,s.label,max(10,int(first/(font*.55))))
            for j,v in enumerate(s.values):text(pad+first+col*(j+.5),y+font+14,number(v),font,'400','middle')
            y+=rh
        y+=28
    elif spec.data:
        d=spec.data
        text(pad,y,d.unit,font)
        top=y+28; bottom=top+(300 if width==360 else 400)
        left=pad+64; right=width-pad-12
        count=int((d.maximum-d.minimum)/d.tick)
        for i in range(count+1):
            v=d.minimum+i*d.tick; yy=bottom-(v-d.minimum)/(d.maximum-d.minimum)*(bottom-top)
            out.append(f'<rect x="{left}" y="{yy:.3f}" width="{right-left}" height="1" fill="#c6cdd2"/>')
            text(left-9,yy+5,number(v),12 if width==360 else 16,anchor='end')
        xs=[left+(right-left)*i/max(1,len(d.categories)-1) for i in range(len(d.categories))]
        for x,c in zip(xs,d.categories,strict=True):text(x,bottom+30,c,14 if width==360 else font,anchor='middle')
        y=bottom+66
        text((left+right)/2,y,d.categoryLabel,font,anchor='middle');y+=40
        for i,s in enumerate(d.series):
            points=' '.join(f'{x:.3f},{bottom-(v-d.minimum)/(d.maximum-d.minimum)*(bottom-top):.3f}' for x,v in zip(xs,s.values,strict=True))
            color=COLORS[i%len(COLORS)]
            coords=[(x,bottom-(v-d.minimum)/(d.maximum-d.minimum)*(bottom-top)) for x,v in zip(xs,s.values,strict=True)]
            for (x1,y1),(x2,y2) in zip(coords,coords[1:]):
                length=hypot(x2-x1,y2-y1); dx=-(y2-y1)/length*1.5;dy=(x2-x1)/length*1.5
                poly=' '.join(f'{x:.3f},{yy:.3f}' for x,yy in [(x1+dx,y1+dy),(x2+dx,y2+dy),(x2-dx,y2-dy),(x1-dx,y1-dy)])
                out.append(f'<polygon points="{poly}" fill="{color}"/>')
            for x,v in zip(xs,s.values,strict=True):
                yy=bottom-(v-d.minimum)/(d.maximum-d.minimum)*(bottom-top)
                out.append(f'<circle cx="{x:.3f}" cy="{yy:.3f}" r="4" fill="{color}"/>')
            out.append(f'<rect x="{pad}" y="{y-9}" width="22" height="4" fill="{color}"/>')
            y=wrapped(pad+34,y,s.label,(width-pad*2-34)//(font//2+1))+9
        y+=12
    else:
        p=spec.process
        for i,s in enumerate(p.stages):
            lines=[f'{s.order}. {s.action}',f'{s.materialBefore} → {s.materialAfter}']
            if s.inputs:lines.append('Add: '+', '.join(s.inputs))
            if s.removals:lines.append('Remove: '+', '.join(s.removals))
            start=y
            chunks=[textwrap.wrap(v,max(12,(width-2*pad-32)//(font//2+1))) for v in lines]
            rh=sum(len(v) for v in chunks)*(font+7)+28
            out.append(f'<rect x="{pad}" y="{start}" width="{width-2*pad}" height="{rh}" rx="8" fill="#eef3f5" stroke="#a9b9c3"/>')
            yy=start+font+15
            for j,group in enumerate(chunks):
                for line in group:text(pad+16,yy,line,font,'600' if j==0 else '400');yy+=font+7
            y=start+rh
            if i<len(p.stages)-1:
                cx=width/2
                for x1,y1,x2,y2 in [(cx,y+4,cx,y+28),(cx-5,y+23,cx,y+28),(cx,y+28,cx+5,y+23)]:
                    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" style="stroke:#444b57;stroke-width:2"/>')
                y+=34
        y+=30
    footnotes=spec.data.footnotes if spec.data else spec.process.footnotes
    for note in footnotes:y=wrapped(pad,y,note,max(15,(width-pad*2)//8),14)+10
    height=int(y+pad)
    header=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title description"><title id="title">{escape(spec.title)}</title><desc id="description">{escape(raw_alt(spec))}</desc><rect width="100%" height="100%" fill="#ffffff"/><g font-family="Arial, sans-serif" fill="#172b38">'
    return (header+''.join(out)+'</g></svg>\n').encode()
