K='#0F1A22'
TEMAS={'Mesopotâmia':('#F2B33D','<rect x="13" y="9" width="14" height="22" rx="3" fill="#E9C99A" stroke="#0F1A22" stroke-width="2.5"/><path d="M16.5 14.5l3 2M21.5 14.5l3 2M16.5 20l3 2M21.5 20l3 2M16.5 26h7" stroke="#0F1A22" stroke-width="2" stroke-linecap="round"/>'),
'Egito':('#E5644A','<path d="M7 30L20 9L33 30Z" fill="#F1DCA6" stroke="#0F1A22" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 9L23.5 30" stroke="#0F1A22" stroke-width="2"/>'),
'Grécia':('#2A9D8F','<path d="M17 8h6M18 8v4c-5 3-6 9-4 14l6 5 6-5c2-5 1-11-4-14V8" fill="#E5A27A" stroke="#0F1A22" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 20h10" stroke="#0F1A22" stroke-width="2"/>'),
'Roma':('#B5473A','<path d="M7 31V13h26v18" fill="#E9DCC2" stroke="#0F1A22" stroke-width="2.5" stroke-linejoin="round"/><path d="M11 31v-7a3 3 0 0 1 6 0v7M23 31v-7a3 3 0 0 1 6 0v7" fill="#FFF6E3" stroke="#0F1A22" stroke-width="2.2"/>'),
'China':('#7FB069','<path d="M10 15h20l-2 9H12z" fill="#C9A15A" stroke="#0F1A22" stroke-width="2.5" stroke-linejoin="round"/><path d="M13 15v-4M27 15v-4M13 24l-2 7M27 24l2 7M20 24v7" stroke="#0F1A22" stroke-width="2.5" stroke-linecap="round"/>'),
'Fenícios':('#8E6BBF','<path d="M7 24h26l-5 7H12z" fill="#C98F5A" stroke="#0F1A22" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 24V8" stroke="#0F1A22" stroke-width="2.5" stroke-linecap="round"/><path d="M20 10l9 10h-9z" fill="#FFF6E3" stroke="#0F1A22" stroke-width="2.2" stroke-linejoin="round"/>')}
SKIN='#D9A27C'
def head(cx=40,cy=31,mood='calmo'):
    eyes = (f'<ellipse cx="{cx-5}" cy="{cy+2}" rx="2.2" ry="2.6" fill="{K}"/><ellipse cx="{cx+5}" cy="{cy+2}" rx="2.2" ry="2.6" fill="{K}"/>'
            f'<circle cx="{cx-4.3}" cy="{cy+1}" r="0.8" fill="#fff"/><circle cx="{cx+5.7}" cy="{cy+1}" r="0.8" fill="#fff"/>')
    brows = f'<path d="M{cx-8} {cy-3.5}q3 -2 6 0M{cx+2} {cy-3.5}q3 -2 6 0" stroke="{K}" stroke-width="1.8" stroke-linecap="round"/>'
    if mood=='feliz':
        eyes=f'<path d="M{cx-7.5} {cy+3}q2.5 -3.5 5 0M{cx+2.5} {cy+3}q2.5 -3.5 5 0" stroke="{K}" stroke-width="2.2" stroke-linecap="round"/>'
        mouth=f'<path d="M{cx-5} {cy+7}q5 6 10 0z" fill="#7A2E22" stroke="{K}" stroke-width="1.8" stroke-linejoin="round"/>'
    else:
        mouth=f'<path d="M{cx-3.5} {cy+7.5}q3.5 2.6 7 0" stroke="{K}" stroke-width="2" stroke-linecap="round"/>'
    blush=f'<ellipse cx="{cx-9}" cy="{cy+6}" rx="2.6" ry="1.6" fill="#E5644A" fill-opacity=".45"/><ellipse cx="{cx+9}" cy="{cy+6}" rx="2.6" ry="1.6" fill="#E5644A" fill-opacity=".45"/>'
    face=f'<circle cx="{cx}" cy="{cy}" r="14" fill="{SKIN}" stroke="{K}" stroke-width="3"/>'
    hat=(f'<path d="M{cx-20} {cy-4}Q{cx} {cy-12} {cx+20} {cy-4}Q{cx} {cy-7} {cx-20} {cy-4}Z" fill="#E3A22C" stroke="{K}" stroke-width="2.6" stroke-linejoin="round"/>'
         f'<path d="M{cx-11} {cy-6}Q{cx-10} {cy-19} {cx} {cy-19}Q{cx+10} {cy-19} {cx+11} {cy-6}Z" fill="#F2B33D" stroke="{K}" stroke-width="2.8" stroke-linejoin="round"/>'
         f'<path d="M{cx-10.5} {cy-9}Q{cx} {cy-12} {cx+10.5} {cy-9}" stroke="#E5644A" stroke-width="3"/>')
    return face+blush+eyes+brows+mouth+hat
def body():
    return ('<path d="M25 47Q40 40 55 47L59 77Q40 82 21 77Z" fill="#2A9D8F" stroke="#0F1A22" stroke-width="3" stroke-linejoin="round"/>'
            '<path d="M23.3 70Q40 74 57.7 70L59 77Q40 82 21 77Z" fill="#1F7F74"/>'
            '<path d="M25 47Q40 40 55 47L59 77Q40 82 21 77Z" stroke="#0F1A22" stroke-width="3" stroke-linejoin="round"/>'
            '<path d="M23 63Q40 68 57 63" stroke="#F2B33D" stroke-width="4"/>'
            '<path d="M31 46Q40 50 49 46" stroke="#E5644A" stroke-width="4" stroke-linecap="round"/>'
            '<path d="M29 47L53 72" stroke="#0F1A22" stroke-width="2.5"/>'
            '<rect x="15" y="59" width="13" height="14" rx="3" fill="#C98F5A" stroke="#0F1A22" stroke-width="2.5"/><path d="M15 64h13" stroke="#0F1A22" stroke-width="2"/>')
def legs(pose):
    if pose=='Andando':
        return ('<path d="M35 76l-6 13M45 76l7 12" stroke="#1D2B36" stroke-width="7" stroke-linecap="round"/>'
                '<path d="M23 89.5h9M50 88.5h9" stroke="#6B4A2B" stroke-width="5" stroke-linecap="round"/>')
    return ('<path d="M35 76v13M45 76v13" stroke="#1D2B36" stroke-width="7" stroke-linecap="round"/>'
            '<path d="M30 90.5h9M42 90.5h9" stroke="#6B4A2B" stroke-width="5" stroke-linecap="round"/>')
def banner(cx,cy,tema,r=15):
    cor,icon=TEMAS[tema]; s=(r-4)*2/40*1.0*0.95*1.9/1.0
    s=0.475*r/15
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{cor}" stroke="{K}" stroke-width="3"/><circle cx="{cx}" cy="{cy}" r="{r-4}" fill="#FFF6E3" stroke="{K}" stroke-width="2"/>'
            f'<g transform="translate({cx-20*s} {cy-20*s}) scale({s})">{icon}</g>')
def viajante(tema,pose,w=88,h=104):
    sh='<ellipse cx="40" cy="96" rx="20" ry="4.5" fill="#0F1A22" fill-opacity="0.3"/>'
    if pose=='Comemorando':
        arms=('<path d="M27 50Q20 42 18 32" stroke="#0F1A22" stroke-width="9" stroke-linecap="round"/><path d="M27 50Q20 42 18 32" stroke="#2A9D8F" stroke-width="4.5" stroke-linecap="round"/><circle cx="18" cy="30" r="4.5" fill="'+SKIN+'" stroke="#0F1A22" stroke-width="2.5"/>'
              '<path d="M53 50Q60 42 63 33" stroke="#0F1A22" stroke-width="9" stroke-linecap="round"/><path d="M53 50Q60 42 63 33" stroke="#2A9D8F" stroke-width="4.5" stroke-linecap="round"/><circle cx="63.5" cy="31" r="4.5" fill="'+SKIN+'" stroke="#0F1A22" stroke-width="2.5"/>')
        staff='<path d="M64 4V40" stroke="#6B4A2B" stroke-width="3.5" stroke-linecap="round"/>'
        spark=''.join(f'<path d="M{x} {y-5}l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z" fill="#F2B33D" stroke="#0F1A22" stroke-width="1.4" stroke-linejoin="round"/>' for x,y in [(8,18),(84,40),(12,52)])
        return f'<svg width="{w}" height="{h}" viewBox="-4 -14 96 118" fill="none" xmlns="http://www.w3.org/2000/svg">{sh}{legs("Parado")}{staff}{body()}{arms}{head(mood="feliz")}{banner(64,4,tema)}{spark}</svg>'
    arm=('<path d="M55 52Q61 56 64 60" stroke="#0F1A22" stroke-width="9" stroke-linecap="round"/><path d="M55 52Q61 56 64 60" stroke="#2A9D8F" stroke-width="4.5" stroke-linecap="round"/>'
         f'<circle cx="65.5" cy="61" r="4.5" fill="{SKIN}" stroke="#0F1A22" stroke-width="2.5"/>')
    staff='<path d="M66 20V92" stroke="#6B4A2B" stroke-width="3.5" stroke-linecap="round"/>'
    return f'<svg width="{w}" height="{h}" viewBox="-4 -4 96 108" fill="none" xmlns="http://www.w3.org/2000/svg">{sh}{legs(pose)}{staff}{body()}{arm}{head()}{banner(66,18,tema)}</svg>'
def retrato(tema,size=220):
    cor,_=TEMAS[tema]
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">'
            f'<circle cx="50" cy="50" r="46" fill="{cor}" stroke="#0F1A22" stroke-width="3"/>'
            '<clipPath id="cp"><circle cx="50" cy="50" r="44.5"/></clipPath><g clip-path="url(#cp)">'
            '<path d="M18 104Q20 74 50 70Q80 74 82 104Z" fill="#2A9D8F" stroke="#0F1A22" stroke-width="3"/>'
            '<path d="M36 72Q50 79 64 72" stroke="#E5644A" stroke-width="5" stroke-linecap="round"/>'
            f'<g transform="translate(-10 -2) scale(1.5)">{head(40,34)}</g></g></svg>')
import json
out={'andando':{t:viajante(t,'Andando') for t in TEMAS},'parado':viajante('Mesopotâmia','Parado'),'comemorando':viajante('Mesopotâmia','Comemorando'),
     'retrato':{t:retrato(t) for t in TEMAS}}
json.dump(out,open('vj.json','w'),ensure_ascii=False)
# preview
pv='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" style="background:#F1DCA6">'
x=10
for t,s in out['andando'].items():
    pv+=f'<g transform="translate({x} 10) scale(1.4)">{s}</g>'; x+=140
pv+=f'<g transform="translate(860 10) scale(1.4)">{out["parado"]}</g><g transform="translate(1000 0) scale(1.4)">{out["comemorando"]}</g>'
x=10
for t,s in list(out['retrato'].items())[:5]:
    pv+=f'<g transform="translate({x} 220)">{s}</g>'; x+=235
pv+='</svg>'
open('pv.svg','w').write(pv)
