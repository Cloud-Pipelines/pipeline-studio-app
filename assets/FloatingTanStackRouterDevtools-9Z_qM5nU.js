import{c as ce,a as Ie,b as F,u as xt,S as mt,d as Y,t as T,i as u,m as Z,e as B,f as d,g as Q,s as a,h as Ze,j as Ge,k as Ct,l as St,n as Qe,o as wt,r as Je,p as gt,q as Ft,v as zt,w as Mt,x as Ut,D as Bt,y as Dt}from"./index-DRTGkQ0x.js";const Et=typeof window>"u";function Ye(e){const t={pending:"yellow",success:"green",error:"red",notFound:"purple",redirected:"gray"};return e.isFetching&&e.status==="success"?e.isFetching==="beforeLoad"?"purple":"blue":t[e.status]}function Ot(e,t){const n=e.find(r=>r.routeId===t.id);return n?Ye(n):"gray"}function Tt(){const[e,t]=ce(!1);return(Et?Ie:F)(()=>{t(!0)}),e}const It=e=>{const t=Object.getOwnPropertyNames(Object(e)),n=typeof e=="bigint"?`${e.toString()}n`:e;try{return JSON.stringify(n,t)}catch{return"unable to stringify"}};function Gt(e,t=[n=>n]){return e.map((n,r)=>[n,r]).sort(([n,r],[p,o])=>{for(const s of t){const c=s(n),g=s(p);if(typeof c>"u"){if(typeof g>"u")continue;return 1}if(c!==g)return c>g?1:-1}return r-o}).map(([n])=>n)}let Pt={data:""},At=e=>typeof window=="object"?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||Pt,Rt=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,Lt=/\/\*[^]*?\*\/|  +/g,pt=/\n+/g,_e=(e,t)=>{let n="",r="",p="";for(let o in e){let s=e[o];o[0]=="@"?o[1]=="i"?n=o+" "+s+";":r+=o[1]=="f"?_e(s,o):o+"{"+_e(s,o[1]=="k"?"":t)+"}":typeof s=="object"?r+=_e(s,t?t.replace(/([^,])+/g,c=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,g=>/&/.test(g)?g.replace(/&/g,c):c?c+" "+g:g)):o):s!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),p+=_e.p?_e.p(o,s):o+":"+s+";")}return n+(t&&p?t+"{"+p+"}":p)+r},he={},bt=e=>{if(typeof e=="object"){let t="";for(let n in e)t+=n+bt(e[n]);return t}return e},jt=(e,t,n,r,p)=>{let o=bt(e),s=he[o]||(he[o]=(g=>{let l=0,i=11;for(;l<g.length;)i=101*i+g.charCodeAt(l++)>>>0;return"go"+i})(o));if(!he[s]){let g=o!==e?e:(l=>{let i,$,v=[{}];for(;i=Rt.exec(l.replace(Lt,""));)i[4]?v.shift():i[3]?($=i[3].replace(pt," ").trim(),v.unshift(v[0][$]=v[0][$]||{})):v[0][i[1]]=i[2].replace(pt," ").trim();return v[0]})(e);he[s]=_e(p?{["@keyframes "+s]:g}:g,n?"":"."+s)}let c=n&&he.g?he.g:null;return n&&(he.g=he[s]),((g,l,i,$)=>{$?l.data=l.data.replace($,g):l.data.indexOf(g)===-1&&(l.data=i?g+l.data:l.data+g)})(he[s],t,r,c),s},Ht=(e,t,n)=>e.reduce((r,p,o)=>{let s=t[o];if(s&&s.call){let c=s(n),g=c&&c.props&&c.props.className||/^go/.test(c)&&c;s=g?"."+g:c&&typeof c=="object"?c.props?"":_e(c,""):c===!1?"":c}return r+p+(s??"")},"");function ze(e){let t=this||{},n=e.call?e(t.p):e;return jt(n.unshift?n.raw?Ht(n,[].slice.call(arguments,1),t.p):n.reduce((r,p)=>Object.assign(r,p&&p.call?p(t.p):p),{}):n,At(t.target),t.g,t.o,t.k)}ze.bind({g:1});ze.bind({k:1});const O={colors:{inherit:"inherit",current:"currentColor",transparent:"transparent",black:"#000000",white:"#ffffff",neutral:{50:"#f9fafb",100:"#f2f4f7",200:"#eaecf0",300:"#d0d5dd",400:"#98a2b3",500:"#667085",600:"#475467",700:"#344054",800:"#1d2939",900:"#101828"},darkGray:{50:"#525c7a",100:"#49536e",200:"#414962",300:"#394056",400:"#313749",500:"#292e3d",600:"#212530",700:"#191c24",800:"#111318",900:"#0b0d10"},gray:{50:"#f9fafb",100:"#f2f4f7",200:"#eaecf0",300:"#d0d5dd",400:"#98a2b3",500:"#667085",600:"#475467",700:"#344054",800:"#1d2939",900:"#101828"},blue:{25:"#F5FAFF",50:"#EFF8FF",100:"#D1E9FF",200:"#B2DDFF",300:"#84CAFF",400:"#53B1FD",500:"#2E90FA",600:"#1570EF",700:"#175CD3",800:"#1849A9",900:"#194185"},green:{25:"#F6FEF9",50:"#ECFDF3",100:"#D1FADF",200:"#A6F4C5",300:"#6CE9A6",400:"#32D583",500:"#12B76A",600:"#039855",700:"#027A48",800:"#05603A",900:"#054F31"},red:{50:"#fef2f2",100:"#fee2e2",200:"#fecaca",300:"#fca5a5",400:"#f87171",500:"#ef4444",600:"#dc2626",700:"#b91c1c",800:"#991b1b",900:"#7f1d1d",950:"#450a0a"},yellow:{25:"#FFFCF5",50:"#FFFAEB",100:"#FEF0C7",200:"#FEDF89",300:"#FEC84B",400:"#FDB022",500:"#F79009",600:"#DC6803",700:"#B54708",800:"#93370D",900:"#7A2E0E"},purple:{25:"#FAFAFF",50:"#F4F3FF",100:"#EBE9FE",200:"#D9D6FE",300:"#BDB4FE",400:"#9B8AFB",500:"#7A5AF8",600:"#6938EF",700:"#5925DC",800:"#4A1FB8",900:"#3E1C96"},teal:{25:"#F6FEFC",50:"#F0FDF9",100:"#CCFBEF",200:"#99F6E0",300:"#5FE9D0",400:"#2ED3B7",500:"#15B79E",600:"#0E9384",700:"#107569",800:"#125D56",900:"#134E48"},pink:{25:"#fdf2f8",50:"#fce7f3",100:"#fbcfe8",200:"#f9a8d4",300:"#f472b6",400:"#ec4899",500:"#db2777",600:"#be185d",700:"#9d174d",800:"#831843",900:"#500724"},cyan:{25:"#ecfeff",50:"#cffafe",100:"#a5f3fc",200:"#67e8f9",300:"#22d3ee",400:"#06b6d4",500:"#0891b2",600:"#0e7490",700:"#155e75",800:"#164e63",900:"#083344"}},alpha:{90:"e5",70:"b3",20:"33"},font:{size:{"2xs":"calc(var(--tsrd-font-size) * 0.625)",xs:"calc(var(--tsrd-font-size) * 0.75)",sm:"calc(var(--tsrd-font-size) * 0.875)",md:"var(--tsrd-font-size)"},lineHeight:{xs:"calc(var(--tsrd-font-size) * 1)",sm:"calc(var(--tsrd-font-size) * 1.25)"},weight:{normal:"400",medium:"500",semibold:"600",bold:"700"},fontFamily:{sans:"ui-sans-serif, Inter, system-ui, sans-serif, sans-serif",mono:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"}},border:{radius:{xs:"calc(var(--tsrd-font-size) * 0.125)",sm:"calc(var(--tsrd-font-size) * 0.25)",md:"calc(var(--tsrd-font-size) * 0.375)",full:"9999px"}},size:{0:"0px",.5:"calc(var(--tsrd-font-size) * 0.125)",1:"calc(var(--tsrd-font-size) * 0.25)",1.5:"calc(var(--tsrd-font-size) * 0.375)",2:"calc(var(--tsrd-font-size) * 0.5)",2.5:"calc(var(--tsrd-font-size) * 0.625)",3:"calc(var(--tsrd-font-size) * 0.75)",3.5:"calc(var(--tsrd-font-size) * 0.875)",4:"calc(var(--tsrd-font-size) * 1)",5:"calc(var(--tsrd-font-size) * 1.25)",8:"calc(var(--tsrd-font-size) * 2)"}},Nt=e=>{const{colors:t,font:n,size:r,alpha:p,border:o}=O,{fontFamily:s,lineHeight:c,size:g}=n,l=e?ze.bind({target:e}):ze;return{devtoolsPanelContainer:l`
      direction: ltr;
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 99999;
      width: 100%;
      max-height: 90%;
      border-top: 1px solid ${t.gray[700]};
      transform-origin: top;
    `,devtoolsPanelContainerVisibility:i=>l`
        visibility: ${i?"visible":"hidden"};
      `,devtoolsPanelContainerResizing:i=>i()?l`
          transition: none;
        `:l`
        transition: all 0.4s ease;
      `,devtoolsPanelContainerAnimation:(i,$)=>i?l`
          pointer-events: auto;
          transform: translateY(0);
        `:l`
        pointer-events: none;
        transform: translateY(${$}px);
      `,logo:l`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      font-family: ${s.sans};
      gap: ${O.size[.5]};
      padding: 0px;
      &:hover {
        opacity: 0.7;
      }
      &:focus-visible {
        outline-offset: 4px;
        border-radius: ${o.radius.xs};
        outline: 2px solid ${t.blue[800]};
      }
    `,tanstackLogo:l`
      font-size: ${n.size.md};
      font-weight: ${n.weight.bold};
      line-height: ${n.lineHeight.xs};
      white-space: nowrap;
      color: ${t.gray[300]};
    `,routerLogo:l`
      font-weight: ${n.weight.semibold};
      font-size: ${n.size.xs};
      background: linear-gradient(to right, #84cc16, #10b981);
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,devtoolsPanel:l`
      display: flex;
      font-size: ${g.sm};
      font-family: ${s.sans};
      background-color: ${t.darkGray[700]};
      color: ${t.gray[300]};

      @media (max-width: 700px) {
        flex-direction: column;
      }
      @media (max-width: 600px) {
        font-size: ${g.xs};
      }
    `,dragHandle:l`
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 4px;
      cursor: row-resize;
      z-index: 100000;
      &:hover {
        background-color: ${t.purple[400]}${p[90]};
      }
    `,firstContainer:l`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      border-right: 1px solid ${t.gray[700]};
      display: flex;
      flex-direction: column;
    `,routerExplorerContainer:l`
      overflow-y: auto;
      flex: 1;
    `,routerExplorer:l`
      padding: ${O.size[2]};
    `,row:l`
      display: flex;
      align-items: center;
      padding: ${O.size[2]} ${O.size[2.5]};
      gap: ${O.size[2.5]};
      border-bottom: ${t.darkGray[500]} 1px solid;
      align-items: center;
    `,detailsHeader:l`
      font-family: ui-sans-serif, Inter, system-ui, sans-serif, sans-serif;
      position: sticky;
      top: 0;
      z-index: 2;
      background-color: ${t.darkGray[600]};
      padding: 0px ${O.size[2]};
      font-weight: ${n.weight.medium};
      font-size: ${n.size.xs};
      min-height: ${O.size[8]};
      line-height: ${n.lineHeight.xs};
      text-align: left;
      display: flex;
      align-items: center;
    `,maskedBadge:l`
      background: ${t.yellow[900]}${p[70]};
      color: ${t.yellow[300]};
      display: inline-block;
      padding: ${O.size[0]} ${O.size[2.5]};
      border-radius: ${o.radius.full};
      font-size: ${n.size.xs};
      font-weight: ${n.weight.normal};
      border: 1px solid ${t.yellow[300]};
    `,maskedLocation:l`
      color: ${t.yellow[300]};
    `,detailsContent:l`
      padding: ${O.size[1.5]} ${O.size[2]};
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: ${n.size.xs};
    `,routeMatchesToggle:l`
      display: flex;
      align-items: center;
      border: 1px solid ${t.gray[500]};
      border-radius: ${o.radius.sm};
      overflow: hidden;
    `,routeMatchesToggleBtn:(i,$)=>{const y=[l`
        appearance: none;
        border: none;
        font-size: 12px;
        padding: 4px 8px;
        background: transparent;
        cursor: pointer;
        font-family: ${s.sans};
        font-weight: ${n.weight.medium};
      `];if(i){const x=l`
          background: ${t.darkGray[400]};
          color: ${t.gray[300]};
        `;y.push(x)}else{const x=l`
          color: ${t.gray[500]};
          background: ${t.darkGray[800]}${p[20]};
        `;y.push(x)}return $&&y.push(l`
          border-right: 1px solid ${O.colors.gray[500]};
        `),y},detailsHeaderInfo:l`
      flex: 1;
      justify-content: flex-end;
      display: flex;
      align-items: center;
      font-weight: ${n.weight.normal};
      color: ${t.gray[400]};
    `,matchRow:i=>{const v=[l`
        display: flex;
        border-bottom: 1px solid ${t.darkGray[400]};
        cursor: pointer;
        align-items: center;
        padding: ${r[1]} ${r[2]};
        gap: ${r[2]};
        font-size: ${g.xs};
        color: ${t.gray[300]};
      `];if(i){const y=l`
          background: ${t.darkGray[500]};
        `;v.push(y)}return v},matchIndicator:i=>{const v=[l`
        flex: 0 0 auto;
        width: ${r[3]};
        height: ${r[3]};
        background: ${t[i][900]};
        border: 1px solid ${t[i][500]};
        border-radius: ${o.radius.full};
        transition: all 0.25s ease-out;
        box-sizing: border-box;
      `];if(i==="gray"){const y=l`
          background: ${t.gray[700]};
          border-color: ${t.gray[400]};
        `;v.push(y)}return v},matchID:l`
      flex: 1;
      line-height: ${c.xs};
    `,ageTicker:i=>{const v=[l`
        display: flex;
        gap: ${r[1]};
        font-size: ${g.xs};
        color: ${t.gray[400]};
        font-variant-numeric: tabular-nums;
        line-height: ${c.xs};
      `];if(i){const y=l`
          color: ${t.yellow[400]};
        `;v.push(y)}return v},secondContainer:l`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      border-right: 1px solid ${t.gray[700]};
      display: flex;
      flex-direction: column;
    `,thirdContainer:l`
      flex: 1 1 500px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      height: 100%;
      border-right: 1px solid ${t.gray[700]};

      @media (max-width: 700px) {
        border-top: 2px solid ${t.gray[700]};
      }
    `,fourthContainer:l`
      flex: 1 1 500px;
      min-height: 40%;
      max-height: 100%;
      overflow: auto;
      display: flex;
      flex-direction: column;
    `,routesContainer:l`
      overflow-x: auto;
      overflow-y: visible;
    `,routesRowContainer:(i,$)=>{const y=[l`
        display: flex;
        border-bottom: 1px solid ${t.darkGray[400]};
        align-items: center;
        padding: ${r[1]} ${r[2]};
        gap: ${r[2]};
        font-size: ${g.xs};
        color: ${t.gray[300]};
        cursor: ${$?"pointer":"default"};
        line-height: ${c.xs};
      `];if(i){const x=l`
          background: ${t.darkGray[500]};
        `;y.push(x)}return y},routesRow:i=>{const v=[l`
        flex: 1 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: ${g.xs};
        line-height: ${c.xs};
      `];if(!i){const y=l`
          color: ${t.gray[400]};
        `;v.push(y)}return v},routesRowInner:l`
      display: 'flex';
      align-items: 'center';
      flex-grow: 1;
      min-width: 0;
    `,routeParamInfo:l`
      color: ${t.gray[400]};
      font-size: ${g.xs};
      line-height: ${c.xs};
    `,nestedRouteRow:i=>l`
        margin-left: ${i?0:r[3.5]};
        border-left: ${i?"":`solid 1px ${t.gray[700]}`};
      `,code:l`
      font-size: ${g.xs};
      line-height: ${c.xs};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `,matchesContainer:l`
      flex: 1 1 auto;
      overflow-y: auto;
    `,cachedMatchesContainer:l`
      flex: 1 1 auto;
      overflow-y: auto;
      max-height: 50%;
    `,maskedBadgeContainer:l`
      flex: 1;
      justify-content: flex-end;
      display: flex;
    `,matchDetails:l`
      display: flex;
      flex-direction: column;
      padding: ${O.size[2]};
      font-size: ${O.font.size.xs};
      color: ${O.colors.gray[300]};
      line-height: ${O.font.lineHeight.sm};
    `,matchStatus:(i,$)=>{const y=$&&i==="success"?$==="beforeLoad"?"purple":"blue":{pending:"yellow",success:"green",error:"red",notFound:"purple",redirected:"gray"}[i];return l`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 40px;
        border-radius: ${O.border.radius.sm};
        font-weight: ${O.font.weight.normal};
        background-color: ${O.colors[y][900]}${O.alpha[90]};
        color: ${O.colors[y][300]};
        border: 1px solid ${O.colors[y][600]};
        margin-bottom: ${O.size[2]};
        transition: all 0.25s ease-out;
      `},matchDetailsInfo:l`
      display: flex;
      justify-content: flex-end;
      flex: 1;
    `,matchDetailsInfoLabel:l`
      display: flex;
    `,mainCloseBtn:l`
      background: ${t.darkGray[700]};
      padding: ${r[1]} ${r[2]} ${r[1]} ${r[1.5]};
      border-radius: ${o.radius.md};
      position: fixed;
      z-index: 99999;
      display: inline-flex;
      width: fit-content;
      cursor: pointer;
      appearance: none;
      border: 0;
      gap: 8px;
      align-items: center;
      border: 1px solid ${t.gray[500]};
      font-size: ${n.size.xs};
      cursor: pointer;
      transition: all 0.25s ease-out;

      &:hover {
        background: ${t.darkGray[500]};
      }
    `,mainCloseBtnPosition:i=>l`
        ${i==="top-left"?`top: ${r[2]}; left: ${r[2]};`:""}
        ${i==="top-right"?`top: ${r[2]}; right: ${r[2]};`:""}
        ${i==="bottom-left"?`bottom: ${r[2]}; left: ${r[2]};`:""}
        ${i==="bottom-right"?`bottom: ${r[2]}; right: ${r[2]};`:""}
      `,mainCloseBtnAnimation:i=>i?l`
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      `:l`
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
        `,routerLogoCloseButton:l`
      font-weight: ${n.weight.semibold};
      font-size: ${n.size.xs};
      background: linear-gradient(to right, #98f30c, #00f4a3);
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,mainCloseBtnDivider:l`
      width: 1px;
      background: ${O.colors.gray[600]};
      height: 100%;
      border-radius: 999999px;
      color: transparent;
    `,mainCloseBtnIconContainer:l`
      position: relative;
      width: ${r[5]};
      height: ${r[5]};
      background: pink;
      border-radius: 999999px;
      overflow: hidden;
    `,mainCloseBtnIconOuter:l`
      width: ${r[5]};
      height: ${r[5]};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      filter: blur(3px) saturate(1.8) contrast(2);
    `,mainCloseBtnIconInner:l`
      width: ${r[4]};
      height: ${r[4]};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `,panelCloseBtn:l`
      position: absolute;
      cursor: pointer;
      z-index: 100001;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      background-color: ${t.darkGray[700]};
      &:hover {
        background-color: ${t.darkGray[500]};
      }

      top: 0;
      right: ${r[2]};
      transform: translate(0, -100%);
      border-right: ${t.darkGray[300]} 1px solid;
      border-left: ${t.darkGray[300]} 1px solid;
      border-top: ${t.darkGray[300]} 1px solid;
      border-bottom: none;
      border-radius: ${o.radius.sm} ${o.radius.sm} 0px 0px;
      padding: ${r[1]} ${r[1.5]} ${r[.5]} ${r[1.5]};

      &::after {
        content: ' ';
        position: absolute;
        top: 100%;
        left: -${r[2.5]};
        height: ${r[1.5]};
        width: calc(100% + ${r[5]});
      }
    `,panelCloseBtnIcon:l`
      color: ${t.gray[400]};
      width: ${r[2]};
      height: ${r[2]};
    `,navigateButton:l`
      background: none;
      border: none;
      padding: 0 0 0 4px;
      margin: 0;
      color: ${t.gray[400]};
      font-size: ${g.md};
      cursor: pointer;
      line-height: 1;
      vertical-align: middle;
      margin-right: 0.5ch;
      flex-shrink: 0;
      &:hover {
        color: ${t.blue[300]};
      }
    `}};function Me(){const e=xt(mt),[t]=ce(Nt(e));return t}const Vt=e=>{try{const t=localStorage.getItem(e);return typeof t=="string"?JSON.parse(t):void 0}catch{return}};function Ne(e,t){const[n,r]=ce();return Ie(()=>{const o=Vt(e);r(typeof o>"u"||o===null?typeof t=="function"?t():t:o)}),[n,o=>{r(s=>{let c=o;typeof o=="function"&&(c=o(s));try{localStorage.setItem(e,JSON.stringify(c))}catch{}return c})}]}var Jt=T('<span><svg xmlns=http://www.w3.org/2000/svg width=12 height=12 fill=none viewBox="0 0 24 24"><path stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M9 18l6-6-6-6">'),Le=T("<div>"),Yt=T("<button><span> "),qt=T("<div><div><button> [<!> ... <!>]"),Kt=T("<button><span></span> 🔄 "),Wt=T("<span>:"),Zt=T("<span>");const vt=({expanded:e,style:t={}})=>{const n=yt();return(()=>{var r=Jt(),p=r.firstChild;return F(o=>{var s=n().expander,c=Q(n().expanderIcon(e));return s!==o.e&&d(r,o.e=s),c!==o.t&&a(p,"class",o.t=c),o},{e:void 0,t:void 0}),r})()};function Qt(e,t){if(t<1)return[];let n=0;const r=[];for(;n<e.length;)r.push(e.slice(n,n+t)),n=n+t;return r}function Xt(e){return Symbol.iterator in e}function Fe({value:e,defaultExpanded:t,pageSize:n=100,filterSubEntries:r,...p}){const[o,s]=ce(!!t),c=()=>s(S=>!S),g=Y(()=>typeof e()),l=Y(()=>{let S=[];const oe=C=>{const h=t===!0?{[C.label]:!0}:t?.[C.label];return{...C,value:()=>C.value,defaultExpanded:h}};return Array.isArray(e())?S=e().map((C,h)=>oe({label:h.toString(),value:C})):e()!==null&&typeof e()=="object"&&Xt(e())&&typeof e()[Symbol.iterator]=="function"?S=Array.from(e(),(C,h)=>oe({label:h.toString(),value:C})):typeof e()=="object"&&e()!==null&&(S=Object.entries(e()).map(([C,h])=>oe({label:C,value:h}))),r?r(S):S}),i=Y(()=>Qt(l(),n)),[$,v]=ce([]),[y,x]=ce(void 0),w=yt(),j=()=>{x(e()())},q=S=>B(Fe,Ge({value:e,filterSubEntries:r},p,S));return(()=>{var S=Le();return u(S,(()=>{var oe=Z(()=>!!i().length);return()=>oe()?[(()=>{var C=Yt(),h=C.firstChild,G=h.firstChild;return C.$$click=()=>c(),u(C,B(vt,{get expanded(){return o()??!1}}),h),u(C,()=>p.label,h),u(h,()=>String(g).toLowerCase()==="iterable"?"(Iterable) ":"",G),u(h,()=>l().length,G),u(h,()=>l().length>1?"items":"item",null),F(ie=>{var ae=w().expandButton,z=w().info;return ae!==ie.e&&d(C,ie.e=ae),z!==ie.t&&d(h,ie.t=z),ie},{e:void 0,t:void 0}),C})(),Z(()=>Z(()=>!!(o()??!1))()?Z(()=>i().length===1)()?(()=>{var C=Le();return u(C,()=>l().map((h,G)=>q(h))),F(()=>d(C,w().subEntries)),C})():(()=>{var C=Le();return u(C,()=>i().map((h,G)=>(()=>{var ie=qt(),ae=ie.firstChild,z=ae.firstChild,K=z.firstChild,ge=K.nextSibling,fe=ge.nextSibling,de=fe.nextSibling;return de.nextSibling,z.$$click=()=>v(H=>H.includes(G)?H.filter(X=>X!==G):[...H,G]),u(z,B(vt,{get expanded(){return $().includes(G)}}),K),u(z,G*n,ge),u(z,G*n+n-1,de),u(ae,(()=>{var H=Z(()=>!!$().includes(G));return()=>H()?(()=>{var X=Le();return u(X,()=>h.map(ne=>q(ne))),F(()=>d(X,w().subEntries)),X})():null})(),null),F(H=>{var X=w().entry,ne=Q(w().labelButton,"labelButton");return X!==H.e&&d(ae,H.e=X),ne!==H.t&&d(z,H.t=ne),H},{e:void 0,t:void 0}),ie})())),F(()=>d(C,w().subEntries)),C})():null)]:(()=>{var C=Z(()=>g()==="function");return()=>C()?B(Fe,{get label(){return(()=>{var h=Kt(),G=h.firstChild;return h.$$click=j,u(G,()=>p.label),F(()=>d(h,w().refreshValueBtn)),h})()},value:y,defaultExpanded:{}}):[(()=>{var h=Wt(),G=h.firstChild;return u(h,()=>p.label,G),h})()," ",(()=>{var h=Zt();return u(h,()=>It(e())),F(()=>d(h,w().value)),h})()]})()})()),F(()=>d(S,w().entry)),S})()}const er=e=>{const{colors:t,font:n,size:r}=O,{fontFamily:p,lineHeight:o,size:s}=n,c=e?ze.bind({target:e}):ze;return{entry:c`
      font-family: ${p.mono};
      font-size: ${s.xs};
      line-height: ${o.sm};
      outline: none;
      word-break: break-word;
    `,labelButton:c`
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      background: transparent;
      border: none;
      padding: 0;
    `,expander:c`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${r[3]};
      height: ${r[3]};
      padding-left: 3px;
      box-sizing: content-box;
    `,expanderIcon:g=>g?c`
          transform: rotate(90deg);
          transition: transform 0.1s ease;
        `:c`
        transform: rotate(0deg);
        transition: transform 0.1s ease;
      `,expandButton:c`
      display: flex;
      gap: ${r[1]};
      align-items: center;
      cursor: pointer;
      color: inherit;
      font: inherit;
      outline: inherit;
      background: transparent;
      border: none;
      padding: 0;
    `,value:c`
      color: ${t.purple[400]};
    `,subEntries:c`
      margin-left: ${r[2]};
      padding-left: ${r[2]};
      border-left: 2px solid ${t.darkGray[400]};
    `,info:c`
      color: ${t.gray[500]};
      font-size: ${s["2xs"]};
      padding-left: ${r[1]};
    `,refreshValueBtn:c`
      appearance: none;
      border: 0;
      cursor: pointer;
      background: transparent;
      color: inherit;
      padding: 0;
      font-family: ${p.mono};
      font-size: ${s.xs};
    `}};function yt(){const e=xt(mt),[t]=ce(er(e));return t}Ze(["click"]);var tr=T("<div><div></div><div>/</div><div></div><div>/</div><div>");function Ve(e){const t=["s","min","h","d"],n=[e/1e3,e/6e4,e/36e5,e/864e5];let r=0;for(let o=1;o<n.length&&!(n[o]<1);o++)r=o;return new Intl.NumberFormat(navigator.language,{compactDisplay:"short",notation:"compact",maximumFractionDigits:0}).format(n[r])+t[r]}function qe({match:e,router:t}){const n=Me();if(!e)return null;const r=t().looseRoutesById[e.routeId];if(!r.options.loader)return null;const p=Date.now()-e.updatedAt,o=r.options.staleTime??t().options.defaultStaleTime??0,s=r.options.gcTime??t().options.defaultGcTime??30*60*1e3;return(()=>{var c=tr(),g=c.firstChild,l=g.nextSibling,i=l.nextSibling,$=i.nextSibling,v=$.nextSibling;return u(g,()=>Ve(p)),u(i,()=>Ve(o)),u(v,()=>Ve(s)),F(()=>d(c,Q(n().ageTicker(p>o)))),c})()}var rr=T("<button type=button>➔");function Ke({to:e,params:t,search:n,router:r}){const p=Me();return(()=>{var o=rr();return o.$$click=s=>{s.stopPropagation(),r().navigate({to:e,params:t,search:n})},a(o,"title",`Navigate to ${e}`),F(()=>d(o,p().navigateButton)),o})()}Ze(["click"]);var ir=T("<button><div>TANSTACK</div><div>TanStack Router v1"),nr=T("<div><div>"),lr=T("<code> "),je=T("<code>"),or=T("<div><div role=button><div>"),He=T("<div>"),ar=T('<div><button><svg xmlns=http://www.w3.org/2000/svg width=10 height=6 fill=none viewBox="0 0 10 6"><path stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=1.667 d="M1 1l4 4 4-4"></path></svg></button><div><div></div><div><div></div></div></div><div><div><div><span>Pathname</span></div><div><code></code></div><div><div><button type=button>Routes</button><button type=button>Matches</button></div><div><div>age / staleTime / gcTime</div></div></div><div>'),sr=T("<div><span>masked"),ht=T("<div role=button><div>"),dr=T("<div><div><div>Cached Matches</div><div>age / staleTime / gcTime</div></div><div>"),cr=T("<div><div>Match Details</div><div><div><div><div></div></div><div><div>ID:</div><div><code></code></div></div><div><div>State:</div><div></div></div><div><div>Last Updated:</div><div></div></div></div></div><div>Explorer</div><div>"),fr=T("<div>Loader Data"),ur=T("<div><div><span>Search Params</span></div><div>"),gr=T("<span style=margin-left:0.5rem;>"),pr=T('<button type=button style=cursor:pointer; aria-label="Copy value to clipboard">');function vr(e){const{className:t,...n}=e,r=Me();return(()=>{var p=ir(),o=p.firstChild,s=o.nextSibling;return Qe(p,Ge(n,{get class(){return Q(r().logo,t?t():"")}}),!1,!0),F(c=>{var g=r().tanstackLogo,l=r().routerLogo;return g!==c.e&&d(o,c.e=g),l!==c.t&&d(s,c.t=l),c},{e:void 0,t:void 0}),p})()}function We(e){return(()=>{var t=nr(),n=t.firstChild;return t.style.setProperty("display","flex"),t.style.setProperty("align-items","center"),t.style.setProperty("width","100%"),u(t,()=>e.left,n),n.style.setProperty("flex-grow","1"),n.style.setProperty("min-width","0"),u(n,()=>e.children),u(t,()=>e.right,null),F(()=>d(t,e.class)),t})()}function kt({routerState:e,router:t,route:n,isRoot:r,activeId:p,setActiveId:o}){const s=Me(),c=Y(()=>e().pendingMatches||e().matches),g=Y(()=>e().matches.find($=>$.routeId===n.id)),l=Y(()=>{var $,v;try{if(($=g())!=null&&$.params){const y=(v=g())==null?void 0:v.params,x=n.path||gt(n.id);if(x.startsWith("$")){const w=x.slice(1);if(y[w])return`(${y[w]})`}}return""}catch{return""}}),i=Y(()=>{if(r||!n.path)return;const $=Object.assign({},...c().map(y=>y.params)),v=Ft({path:n.fullPath,params:$,leaveWildcards:!1,leaveParams:!1,decodeCharMap:t().pathParamsDecodeCharMap});return v.isMissingParams?void 0:v.interpolatedPath});return(()=>{var $=or(),v=$.firstChild,y=v.firstChild;return v.$$click=()=>{g()&&o(p()===n.id?"":n.id)},u(v,B(We,{get class(){return Q(s().routesRow(!!g()))},get left(){return B(zt,{get when(){return i()},children:x=>B(Ke,{get to(){return x()},router:t})})},get right(){return B(qe,{get match(){return g()},router:t})},get children(){return[(()=>{var x=lr(),w=x.firstChild;return u(x,()=>r?Je:n.path||gt(n.id),w),F(()=>d(x,s().code)),x})(),(()=>{var x=je();return u(x,l),F(()=>d(x,s().routeParamInfo)),x})()]}}),null),u($,(()=>{var x=Z(()=>{var w;return!!((w=n.children)!=null&&w.length)});return()=>x()?(()=>{var w=He();return u(w,()=>[...n.children].sort((j,q)=>j.rank-q.rank).map(j=>B(kt,{routerState:e,router:t,route:j,activeId:p,setActiveId:o}))),F(()=>d(w,s().nestedRouteRow(!!r))),w})():null})(),null),F(x=>{var w=`Open match details for ${n.id}`,j=Q(s().routesRowContainer(n.id===p(),!!g())),q=Q(s().matchIndicator(Ot(c(),n)));return w!==x.e&&a(v,"aria-label",x.e=w),j!==x.t&&d(v,x.t=j),q!==x.a&&d(y,x.a=q),x},{e:void 0,t:void 0,a:void 0}),$})()}const hr=function({...t}){const{isOpen:n=!0,setIsOpen:r,handleDragStart:p,router:o,routerState:s,shadowDOMTarget:c,...g}=t,{onCloseClick:l}=Ct(),i=Me(),{className:$,style:v,...y}=g;St(o);const[x,w]=Ne("tanstackRouterDevtoolsShowMatches",!0),[j,q]=Ne("tanstackRouterDevtoolsActiveRouteId",""),S=Y(()=>[...s().pendingMatches??[],...s().matches,...s().cachedMatches].find(K=>K.routeId===j()||K.id===j())),oe=Y(()=>Object.keys(s().location.search).length),C=Y(()=>({...o(),state:s()})),h=Y(()=>Object.fromEntries(Gt(Object.keys(C()),["state","routesById","routesByPath","flatRoutes","options","manifest"].map(z=>K=>K!==z)).map(z=>[z,C()[z]]).filter(z=>typeof z[1]!="function"&&!["__store","basepath","injectedHtml","subscribers","latestLoadPromise","navigateTimeout","resetNextScroll","tempLocationKey","latestLocation","routeTree","history"].includes(z[0])))),G=Y(()=>{var z;return(z=S())==null?void 0:z.loaderData}),ie=Y(()=>S()),ae=Y(()=>s().location.search);return(()=>{var z=ar(),K=z.firstChild,ge=K.firstChild,fe=K.nextSibling,de=fe.firstChild,H=de.nextSibling,X=H.firstChild,ne=fe.nextSibling,Ce=ne.firstChild,pe=Ce.firstChild;pe.firstChild;var D=pe.nextSibling,V=D.firstChild,W=D.nextSibling,N=W.firstChild,J=N.firstChild,ee=J.nextSibling,I=N.nextSibling,te=W.nextSibling;return Qe(z,Ge({get class(){return Q(i().devtoolsPanel,"TanStackRouterDevtoolsPanel",$?$():"")},get style(){return v?v():""}},y),!1,!0),u(z,p?(()=>{var f=He();return wt(f,"mousedown",p,!0),F(()=>d(f,i().dragHandle)),f})():null,K),K.$$click=f=>{r&&r(!1),l(f)},u(de,B(vr,{"aria-hidden":!0,onClick:f=>{r&&r(!1),l(f)}})),u(X,B(Fe,{label:"Router",value:h,defaultExpanded:{state:{},context:{},options:{}},filterSubEntries:f=>f.filter(k=>typeof k.value()!="function")})),u(pe,(()=>{var f=Z(()=>!!s().location.maskedLocation);return()=>f()?(()=>{var k=sr(),M=k.firstChild;return F(P=>{var m=i().maskedBadgeContainer,L=i().maskedBadge;return m!==P.e&&d(k,P.e=m),L!==P.t&&d(M,P.t=L),P},{e:void 0,t:void 0}),k})():null})(),null),u(V,()=>s().location.pathname),u(D,(()=>{var f=Z(()=>!!s().location.maskedLocation);return()=>f()?(()=>{var k=je();return u(k,()=>{var M;return(M=s().location.maskedLocation)==null?void 0:M.pathname}),F(()=>d(k,i().maskedLocation)),k})():null})(),null),J.$$click=()=>{w(!1)},ee.$$click=()=>{w(!0)},u(te,(()=>{var f=Z(()=>!x());return()=>f()?B(kt,{routerState:s,router:o,get route(){return o().routeTree},isRoot:!0,activeId:j,setActiveId:q}):(()=>{var k=He();return u(k,()=>{var M,P;return(P=(M=s().pendingMatches)!=null&&M.length?s().pendingMatches:s().matches)==null?void 0:P.map((m,L)=>(()=>{var _=ht(),A=_.firstChild;return _.$$click=()=>q(j()===m.id?"":m.id),u(_,B(We,{get left(){return B(Ke,{get to(){return m.pathname},get params(){return m.params},get search(){return m.search},router:o})},get right(){return B(qe,{match:m,router:o})},get children(){var R=je();return u(R,()=>`${m.routeId===Je?Je:m.pathname}`),F(()=>d(R,i().matchID)),R}}),null),F(R=>{var E=`Open match details for ${m.id}`,se=Q(i().matchRow(m===S())),re=Q(i().matchIndicator(Ye(m)));return E!==R.e&&a(_,"aria-label",R.e=E),se!==R.t&&d(_,R.t=se),re!==R.a&&d(A,R.a=re),R},{e:void 0,t:void 0,a:void 0}),_})())}),k})()})()),u(ne,(()=>{var f=Z(()=>!!s().cachedMatches.length);return()=>f()?(()=>{var k=dr(),M=k.firstChild,P=M.firstChild,m=P.nextSibling,L=M.nextSibling;return u(L,()=>s().cachedMatches.map(_=>(()=>{var A=ht(),R=A.firstChild;return A.$$click=()=>q(j()===_.id?"":_.id),u(A,B(We,{get left(){return B(Ke,{get to(){return _.pathname},get params(){return _.params},get search(){return _.search},router:o})},get right(){return B(qe,{match:_,router:o})},get children(){var E=je();return u(E,()=>`${_.id}`),F(()=>d(E,i().matchID)),E}}),null),F(E=>{var se=`Open match details for ${_.id}`,re=Q(i().matchRow(_===S())),ue=Q(i().matchIndicator(Ye(_)));return se!==E.e&&a(A,"aria-label",E.e=se),re!==E.t&&d(A,E.t=re),ue!==E.a&&d(R,E.a=ue),E},{e:void 0,t:void 0,a:void 0}),A})())),F(_=>{var A=i().cachedMatchesContainer,R=i().detailsHeader,E=i().detailsHeaderInfo;return A!==_.e&&d(k,_.e=A),R!==_.t&&d(M,_.t=R),E!==_.a&&d(m,_.a=E),_},{e:void 0,t:void 0,a:void 0}),k})():null})(),null),u(z,(()=>{var f=Z(()=>{var k;return!!(S()&&((k=S())!=null&&k.status))});return()=>f()?(()=>{var k=cr(),M=k.firstChild,P=M.nextSibling,m=P.firstChild,L=m.firstChild,_=L.firstChild,A=L.nextSibling,R=A.firstChild,E=R.nextSibling,se=E.firstChild,re=A.nextSibling,ue=re.firstChild,$e=ue.nextSibling,xe=re.nextSibling,be=xe.firstChild,me=be.nextSibling,ve=P.nextSibling,ye=ve.nextSibling;return u(_,(()=>{var b=Z(()=>{var U,le;return!!(((U=S())==null?void 0:U.status)==="success"&&((le=S())!=null&&le.isFetching))});return()=>{var U;return b()?"fetching":(U=S())==null?void 0:U.status}})()),u(se,()=>{var b;return(b=S())==null?void 0:b.id}),u($e,(()=>{var b=Z(()=>{var U;return!!((U=s().pendingMatches)!=null&&U.find(le=>{var ke;return le.id===((ke=S())==null?void 0:ke.id)}))});return()=>b()?"Pending":s().matches.find(U=>{var le;return U.id===((le=S())==null?void 0:le.id)})?"Active":"Cached"})()),u(me,(()=>{var b=Z(()=>{var U;return!!((U=S())!=null&&U.updatedAt)});return()=>{var U;return b()?new Date((U=S())==null?void 0:U.updatedAt).toLocaleTimeString():"N/A"}})()),u(k,(()=>{var b=Z(()=>!!G());return()=>b()?[(()=>{var U=fr();return F(()=>d(U,i().detailsHeader)),U})(),(()=>{var U=He();return u(U,B(Fe,{label:"loaderData",value:G,defaultExpanded:{}})),F(()=>d(U,i().detailsContent)),U})()]:null})(),ve),u(ye,B(Fe,{label:"Match",value:ie,defaultExpanded:{}})),F(b=>{var U,le,ke=i().thirdContainer,Ue=i().detailsHeader,Se=i().matchDetails,Be=i().matchStatus((U=S())==null?void 0:U.status,(le=S())==null?void 0:le.isFetching),Pe=i().matchDetailsInfoLabel,we=i().matchDetailsInfo,Ae=i().matchDetailsInfoLabel,De=i().matchDetailsInfo,Re=i().matchDetailsInfoLabel,Ee=i().matchDetailsInfo,Oe=i().detailsHeader,Te=i().detailsContent;return ke!==b.e&&d(k,b.e=ke),Ue!==b.t&&d(M,b.t=Ue),Se!==b.a&&d(m,b.a=Se),Be!==b.o&&d(L,b.o=Be),Pe!==b.i&&d(A,b.i=Pe),we!==b.n&&d(E,b.n=we),Ae!==b.s&&d(re,b.s=Ae),De!==b.h&&d($e,b.h=De),Re!==b.r&&d(xe,b.r=Re),Ee!==b.d&&d(me,b.d=Ee),Oe!==b.l&&d(ve,b.l=Oe),Te!==b.u&&d(ye,b.u=Te),b},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0,l:void 0,u:void 0}),k})():null})(),null),u(z,(()=>{var f=Z(()=>!!oe());return()=>f()?(()=>{var k=ur(),M=k.firstChild;M.firstChild;var P=M.nextSibling;return u(M,typeof navigator<"u"?(()=>{var m=gr();return u(m,B($r,{getValue:()=>{const L=s().location.search;return JSON.stringify(L)}})),m})():null,null),u(P,B(Fe,{value:ae,get defaultExpanded(){return Object.keys(s().location.search).reduce((m,L)=>(m[L]={},m),{})}})),F(m=>{var L=i().fourthContainer,_=i().detailsHeader,A=i().detailsContent;return L!==m.e&&d(k,m.e=L),_!==m.t&&d(M,m.t=_),A!==m.a&&d(P,m.a=A),m},{e:void 0,t:void 0,a:void 0}),k})():null})(),null),F(f=>{var k=i().panelCloseBtn,M=i().panelCloseBtnIcon,P=i().firstContainer,m=i().row,L=i().routerExplorerContainer,_=i().routerExplorer,A=i().secondContainer,R=i().matchesContainer,E=i().detailsHeader,se=i().detailsContent,re=i().detailsHeader,ue=i().routeMatchesToggle,$e=!x(),xe=Q(i().routeMatchesToggleBtn(!x(),!0)),be=x(),me=Q(i().routeMatchesToggleBtn(!!x(),!1)),ve=i().detailsHeaderInfo,ye=Q(i().routesContainer);return k!==f.e&&d(K,f.e=k),M!==f.t&&a(ge,"class",f.t=M),P!==f.a&&d(fe,f.a=P),m!==f.o&&d(de,f.o=m),L!==f.i&&d(H,f.i=L),_!==f.n&&d(X,f.n=_),A!==f.s&&d(ne,f.s=A),R!==f.h&&d(Ce,f.h=R),E!==f.r&&d(pe,f.r=E),se!==f.d&&d(D,f.d=se),re!==f.l&&d(W,f.l=re),ue!==f.u&&d(N,f.u=ue),$e!==f.c&&(J.disabled=f.c=$e),xe!==f.w&&d(J,f.w=xe),be!==f.m&&(ee.disabled=f.m=be),me!==f.f&&d(ee,f.f=me),ve!==f.y&&d(I,f.y=ve),ye!==f.g&&d(te,f.g=ye),f},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0,h:void 0,r:void 0,d:void 0,l:void 0,u:void 0,c:void 0,w:void 0,m:void 0,f:void 0,y:void 0,g:void 0}),z})()};function $r({getValue:e}){const[t,n]=ce(!1);let r=null;const p=async()=>{var o;if(typeof navigator>"u"||!((o=navigator.clipboard)!=null&&o.writeText)){console.warn("TanStack Router Devtools: Clipboard API unavailable");return}try{const s=e();await navigator.clipboard.writeText(s),n(!0),r&&clearTimeout(r),r=setTimeout(()=>n(!1),2500)}catch(s){console.error("TanStack Router Devtools: Failed to copy",s)}};return Mt(()=>{r&&clearTimeout(r)}),(()=>{var o=pr();return o.$$click=p,u(o,()=>t()?"✅":"📋"),F(()=>a(o,"title",t()?"Copied!":"Copy")),o})()}Ze(["click","mousedown"]);var xr=T('<svg xmlns=http://www.w3.org/2000/svg enable-background="new 0 0 634 633"viewBox="0 0 634 633"><g transform=translate(1)><linearGradient x1=-641.486 x2=-641.486 y1=856.648 y2=855.931 gradientTransform="matrix(633 0 0 -633 406377 542258)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#6bdaff></stop><stop offset=0.319 stop-color=#f9ffb5></stop><stop offset=0.706 stop-color=#ffa770></stop><stop offset=1 stop-color=#ff7373></stop></linearGradient><circle cx=316.5 cy=316.5 r=316.5 fill-rule=evenodd clip-rule=evenodd></circle><defs><filter width=454 height=396.9 x=-137.5 y=412 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=-137.5 y=412 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=89.5 cy=610.5 fill=#015064 fill-rule=evenodd stroke=#00CFE2 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=316.5 y=412 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=316.5 y=412 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=543.5 cy=610.5 fill=#015064 fill-rule=evenodd stroke=#00CFE2 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=-137.5 y=450 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=-137.5 y=450 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=89.5 cy=648.5 fill=#015064 fill-rule=evenodd stroke=#00A8B8 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=316.5 y=450 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=316.5 y=450 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=543.5 cy=648.5 fill=#015064 fill-rule=evenodd stroke=#00A8B8 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=-137.5 y=486 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=-137.5 y=486 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=89.5 cy=684.5 fill=#015064 fill-rule=evenodd stroke=#007782 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=454 height=396.9 x=316.5 y=486 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=454 height=396.9 x=316.5 y=486 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><ellipse cx=543.5 cy=684.5 fill=#015064 fill-rule=evenodd stroke=#007782 stroke-width=25 clip-rule=evenodd rx=214.5 ry=186></ellipse><defs><filter width=176.9 height=129.3 x=272.2 y=308 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=176.9 height=129.3 x=272.2 y=308 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><g><path fill=none stroke=#000 stroke-linecap=round stroke-linejoin=bevel stroke-width=11 d="M436 403.2l-5 28.6m-140-90.3l-10.9 62m52.8-19.4l-4.3 27.1"></path><linearGradient x1=-645.656 x2=-646.499 y1=854.878 y2=854.788 gradientTransform="matrix(-184.159 -32.4722 11.4608 -64.9973 -128419.844 34938.836)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ee2700></stop><stop offset=1 stop-color=#ff008e></stop></linearGradient><path fill-rule=evenodd d="M344.1 363l97.7 17.2c5.8 2.1 8.2 6.2 7.1 12.1-1 5.9-4.7 9.2-11 9.9l-106-18.7-57.5-59.2c-3.2-4.8-2.9-9.1.8-12.8 3.7-3.7 8.3-4.4 13.7-2.1l55.2 53.6z"clip-rule=evenodd></path><path fill=#D8D8D8 fill-rule=evenodd stroke=#FFF stroke-linecap=round stroke-linejoin=bevel stroke-width=7 d="M428.3 384.5l.9-6.5m-33.9 1.5l.9-6.5m-34 .5l.9-6.1m-38.9-16.1l4.2-3.9m-25.2-16.1l4.2-3.9"clip-rule=evenodd></path></g><defs><filter width=280.6 height=317.4 x=73.2 y=113.9 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=280.6 height=317.4 x=73.2 y=113.9 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><g><linearGradient x1=-646.8 x2=-646.8 y1=854.844 y2=853.844 gradientTransform="matrix(-100.1751 48.8587 -97.9753 -200.879 19124.773 203538.61)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#a17500></stop><stop offset=1 stop-color=#5d2100></stop></linearGradient><path fill-rule=evenodd d="M192.3 203c8.1 37.3 14 73.6 17.8 109.1 3.8 35.4 2.8 75.2-2.9 119.2l61.2-16.7c-15.6-59-25.2-97.9-28.6-116.6-3.4-18.7-10.8-51.8-22.2-99.6l-25.3 4.6"clip-rule=evenodd></path><linearGradient x1=-635.467 x2=-635.467 y1=852.115 y2=851.115 gradientTransform="matrix(92.6873 4.8575 2.0257 -38.6535 57323.695 36176.047)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M195 183.9s-12.6-22.1-36.5-29.9c-15.9-5.2-34.4-1.5-55.5 11.1 15.9 14.3 29.5 22.6 40.7 24.9 16.8 3.6 51.3-6.1 51.3-6.1z"clip-rule=evenodd></path><linearGradient x1=-636.573 x2=-636.573 y1=855.444 y2=854.444 gradientTransform="matrix(109.9945 5.7646 6.3597 -121.3507 64719.133 107659.336)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M194.9 184.5s-47.5-8.5-83.2 15.7c-23.8 16.2-34.3 49.3-31.6 99.3 30.3-27.8 52.1-48.5 65.2-61.9 19.8-20 49.6-53.1 49.6-53.1z"clip-rule=evenodd></path><linearGradient x1=-632.145 x2=-632.145 y1=854.174 y2=853.174 gradientTransform="matrix(62.9558 3.2994 3.5021 -66.8246 37035.367 59284.227)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M195 183.9c-.8-21.9 6-38 20.6-48.2 14.6-10.2 29.8-15.3 45.5-15.3-6.1 21.4-14.5 35.8-25.2 43.4-10.7 7.5-24.4 14.2-40.9 20.1z"clip-rule=evenodd></path><linearGradient x1=-638.224 x2=-638.224 y1=853.801 y2=852.801 gradientTransform="matrix(152.4666 7.9904 3.0934 -59.0251 94939.86 55646.855)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M194.9 184.5c31.9-30 64.1-39.7 96.7-29 32.6 10.7 50.8 30.4 54.6 59.1-35.2-5.5-60.4-9.6-75.8-12.1-15.3-2.6-40.5-8.6-75.5-18z"clip-rule=evenodd></path><linearGradient x1=-637.723 x2=-637.723 y1=855.103 y2=854.103 gradientTransform="matrix(136.467 7.1519 5.2165 -99.5377 82830.875 89859.578)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M194.9 184.5c35.8-7.6 65.6-.2 89.2 22 23.6 22.2 37.7 49 42.3 80.3-39.8-9.7-68.3-23.8-85.5-42.4-17.2-18.5-32.5-38.5-46-59.9z"clip-rule=evenodd></path><linearGradient x1=-631.79 x2=-631.79 y1=855.872 y2=854.872 gradientTransform="matrix(60.8683 3.19 8.7771 -167.4773 31110.818 145537.61)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#2f8a00></stop><stop offset=1 stop-color=#90ff57></stop></linearGradient><path fill-rule=evenodd stroke=#2F8A00 stroke-width=13 d="M194.9 184.5c-33.6 13.8-53.6 35.7-60.1 65.6-6.5 29.9-3.6 63.1 8.7 99.6 27.4-40.3 43.2-69.6 47.4-88 4.2-18.3 5.5-44.1 4-77.2z"clip-rule=evenodd></path><path fill=none stroke=#2F8A00 stroke-linecap=round stroke-width=8 d="M196.5 182.3c-14.8 21.6-25.1 41.4-30.8 59.4-5.7 18-9.4 33-11.1 45.1"></path><path fill=none stroke=#2F8A00 stroke-linecap=round stroke-width=8 d="M194.8 185.7c-24.4 1.7-43.8 9-58.1 21.8-14.3 12.8-24.7 25.4-31.3 37.8m99.1-68.9c29.7-6.7 52-8.4 67-5 15 3.4 26.9 8.7 35.8 15.9m-110.8-5.9c20.3 9.9 38.2 20.5 53.9 31.9 15.7 11.4 27.4 22.1 35.1 32"></path></g><defs><filter width=532 height=633 x=50.5 y=399 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=532 height=633 x=50.5 y=399 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><linearGradient x1=-641.104 x2=-641.278 y1=856.577 y2=856.183 gradientTransform="matrix(532 0 0 -633 341484.5 542657)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#fff400></stop><stop offset=1 stop-color=#3c8700></stop></linearGradient><ellipse cx=316.5 cy=715.5 fill-rule=evenodd clip-rule=evenodd rx=266 ry=316.5></ellipse><defs><filter width=288 height=283 x=391 y=-24 filterUnits=userSpaceOnUse><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><mask width=288 height=283 x=391 y=-24 maskUnits=userSpaceOnUse><g><circle cx=316.5 cy=316.5 r=316.5 fill=#FFF fill-rule=evenodd clip-rule=evenodd></circle></g></mask><g><g transform="translate(397 -24)"><linearGradient x1=-1036.672 x2=-1036.672 y1=880.018 y2=879.018 gradientTransform="matrix(227 0 0 -227 235493 199764)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffdf00></stop><stop offset=1 stop-color=#ff9d00></stop></linearGradient><circle cx=168.5 cy=113.5 r=113.5 fill-rule=evenodd clip-rule=evenodd></circle><linearGradient x1=-1017.329 x2=-1018.602 y1=658.003 y2=657.998 gradientTransform="matrix(30 0 0 -1 30558 771)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M30 113H0"></path><linearGradient x1=-1014.501 x2=-1015.774 y1=839.985 y2=839.935 gradientTransform="matrix(26.5 0 0 -5.5 26925 4696.5)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M33.5 79.5L7 74"></path><linearGradient x1=-1016.59 x2=-1017.862 y1=852.671 y2=852.595 gradientTransform="matrix(29 0 0 -8 29523 6971)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M34 146l-29 8"></path><linearGradient x1=-1011.984 x2=-1013.257 y1=863.523 y2=863.229 gradientTransform="matrix(24 0 0 -13 24339 11407)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M45 177l-24 13"></path><linearGradient x1=-1006.673 x2=-1007.946 y1=869.279 y2=868.376 gradientTransform="matrix(20 0 0 -19 20205 16720)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M67 204l-20 19"></path><linearGradient x1=-992.85 x2=-993.317 y1=871.258 y2=870.258 gradientTransform="matrix(13.8339 0 0 -22.8467 13825.796 20131.938)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M94.4 227l-13.8 22.8"></path><linearGradient x1=-953.835 x2=-953.965 y1=871.9 y2=870.9 gradientTransform="matrix(7.5 0 0 -24.5 7278 21605)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M127.5 243.5L120 268"></path><linearGradient x1=244.504 x2=244.496 y1=871.898 y2=870.898 gradientTransform="matrix(.5 0 0 -24.5 45.5 21614)"gradientUnits=userSpaceOnUse><stop offset=0 stop-color=#ffa400></stop><stop offset=1 stop-color=#ff5e00></stop></linearGradient><path fill=none stroke-linecap=round stroke-linejoin=bevel stroke-width=12 d="M167.5 252.5l.5 24.5">');function $t(){const e=Ut();return(()=>{var t=xr(),n=t.firstChild,r=n.firstChild,p=r.nextSibling,o=p.nextSibling,s=o.firstChild,c=o.nextSibling,g=c.firstChild,l=c.nextSibling,i=l.nextSibling,$=i.firstChild,v=i.nextSibling,y=v.firstChild,x=v.nextSibling,w=x.nextSibling,j=w.firstChild,q=w.nextSibling,S=q.firstChild,oe=q.nextSibling,C=oe.nextSibling,h=C.firstChild,G=C.nextSibling,ie=G.firstChild,ae=G.nextSibling,z=ae.nextSibling,K=z.firstChild,ge=z.nextSibling,fe=ge.firstChild,de=ge.nextSibling,H=de.nextSibling,X=H.firstChild,ne=H.nextSibling,Ce=ne.firstChild,pe=ne.nextSibling,D=pe.nextSibling,V=D.firstChild,W=D.nextSibling,N=W.firstChild,J=W.nextSibling,ee=J.firstChild,I=ee.nextSibling,te=I.nextSibling,f=J.nextSibling,k=f.firstChild,M=f.nextSibling,P=M.firstChild,m=M.nextSibling,L=m.firstChild,_=L.nextSibling,A=_.nextSibling,R=A.nextSibling,E=R.nextSibling,se=E.nextSibling,re=se.nextSibling,ue=re.nextSibling,$e=ue.nextSibling,xe=$e.nextSibling,be=xe.nextSibling,me=be.nextSibling,ve=me.nextSibling,ye=ve.nextSibling,b=m.nextSibling,U=b.firstChild,le=b.nextSibling,ke=le.firstChild,Ue=le.nextSibling,Se=Ue.nextSibling,Be=Se.nextSibling,Pe=Be.firstChild,we=Be.nextSibling,Ae=we.firstChild,De=we.nextSibling,Re=De.firstChild,Ee=Re.firstChild,Oe=Ee.nextSibling,Te=Oe.nextSibling,Xe=Te.nextSibling,et=Xe.nextSibling,tt=et.nextSibling,rt=tt.nextSibling,it=rt.nextSibling,nt=it.nextSibling,lt=nt.nextSibling,ot=lt.nextSibling,at=ot.nextSibling,st=at.nextSibling,dt=st.nextSibling,ct=dt.nextSibling,ft=ct.nextSibling,ut=ft.nextSibling,_t=ut.nextSibling;return a(r,"id",`a-${e}`),a(p,"fill",`url(#a-${e})`),a(s,"id",`b-${e}`),a(c,"id",`c-${e}`),a(g,"filter",`url(#b-${e})`),a(l,"mask",`url(#c-${e})`),a($,"id",`d-${e}`),a(v,"id",`e-${e}`),a(y,"filter",`url(#d-${e})`),a(x,"mask",`url(#e-${e})`),a(j,"id",`f-${e}`),a(q,"id",`g-${e}`),a(S,"filter",`url(#f-${e})`),a(oe,"mask",`url(#g-${e})`),a(h,"id",`h-${e}`),a(G,"id",`i-${e}`),a(ie,"filter",`url(#h-${e})`),a(ae,"mask",`url(#i-${e})`),a(K,"id",`j-${e}`),a(ge,"id",`k-${e}`),a(fe,"filter",`url(#j-${e})`),a(de,"mask",`url(#k-${e})`),a(X,"id",`l-${e}`),a(ne,"id",`m-${e}`),a(Ce,"filter",`url(#l-${e})`),a(pe,"mask",`url(#m-${e})`),a(V,"id",`n-${e}`),a(W,"id",`o-${e}`),a(N,"filter",`url(#n-${e})`),a(J,"mask",`url(#o-${e})`),a(I,"id",`p-${e}`),a(te,"fill",`url(#p-${e})`),a(k,"id",`q-${e}`),a(M,"id",`r-${e}`),a(P,"filter",`url(#q-${e})`),a(m,"mask",`url(#r-${e})`),a(L,"id",`s-${e}`),a(_,"fill",`url(#s-${e})`),a(A,"id",`t-${e}`),a(R,"fill",`url(#t-${e})`),a(E,"id",`u-${e}`),a(se,"fill",`url(#u-${e})`),a(re,"id",`v-${e}`),a(ue,"fill",`url(#v-${e})`),a($e,"id",`w-${e}`),a(xe,"fill",`url(#w-${e})`),a(be,"id",`x-${e}`),a(me,"fill",`url(#x-${e})`),a(ve,"id",`y-${e}`),a(ye,"fill",`url(#y-${e})`),a(U,"id",`z-${e}`),a(le,"id",`A-${e}`),a(ke,"filter",`url(#z-${e})`),a(Ue,"id",`B-${e}`),a(Se,"fill",`url(#B-${e})`),a(Se,"mask",`url(#A-${e})`),a(Pe,"id",`C-${e}`),a(we,"id",`D-${e}`),a(Ae,"filter",`url(#C-${e})`),a(De,"mask",`url(#D-${e})`),a(Ee,"id",`E-${e}`),a(Oe,"fill",`url(#E-${e})`),a(Te,"id",`F-${e}`),a(Xe,"stroke",`url(#F-${e})`),a(et,"id",`G-${e}`),a(tt,"stroke",`url(#G-${e})`),a(rt,"id",`H-${e}`),a(it,"stroke",`url(#H-${e})`),a(nt,"id",`I-${e}`),a(lt,"stroke",`url(#I-${e})`),a(ot,"id",`J-${e}`),a(at,"stroke",`url(#J-${e})`),a(st,"id",`K-${e}`),a(dt,"stroke",`url(#K-${e})`),a(ct,"id",`L-${e}`),a(ft,"stroke",`url(#L-${e})`),a(ut,"id",`M-${e}`),a(_t,"stroke",`url(#M-${e})`),t})()}var mr=T("<button type=button><div><div></div><div></div></div><div>-</div><div>TanStack Router");function yr({initialIsOpen:e,panelProps:t={},closeButtonProps:n={},toggleButtonProps:r={},position:p="bottom-left",containerElement:o="footer",router:s,routerState:c,shadowDOMTarget:g}){const[l,i]=ce();let $;const[v,y]=Ne("tanstackRouterDevtoolsOpen",e),[x,w]=Ne("tanstackRouterDevtoolsHeight",null),[j,q]=ce(!1),[S,oe]=ce(!1),C=Tt(),h=Me(),G=(D,V)=>{if(V.button!==0)return;oe(!0);const W={originalHeight:D?.getBoundingClientRect().height??0,pageY:V.pageY},N=ee=>{const I=W.pageY-ee.pageY,te=W.originalHeight+I;w(te),te<70?y(!1):y(!0)},J=()=>{oe(!1),document.removeEventListener("mousemove",N),document.removeEventListener("mouseUp",J)};document.addEventListener("mousemove",N),document.addEventListener("mouseup",J)};v(),Ie(()=>{q(v()??!1)}),Ie(()=>{var D,V,W;if(j()){const N=(V=(D=l())==null?void 0:D.parentElement)==null?void 0:V.style.paddingBottom,J=()=>{var ee;const I=$.getBoundingClientRect().height;(ee=l())!=null&&ee.parentElement&&i(te=>(te?.parentElement&&(te.parentElement.style.paddingBottom=`${I}px`),te))};if(J(),typeof window<"u")return window.addEventListener("resize",J),()=>{var ee;window.removeEventListener("resize",J),(ee=l())!=null&&ee.parentElement&&typeof N=="string"&&i(I=>(I.parentElement.style.paddingBottom=N,I))}}else(W=l())!=null&&W.parentElement&&i(N=>(N?.parentElement&&N.parentElement.removeAttribute("style"),N))}),Ie(()=>{if(l()){const D=l(),V=getComputedStyle(D).fontSize;D?.style.setProperty("--tsrd-font-size",V)}});const{style:ie={},...ae}=t,{style:z={},onClick:K,...ge}=n,{onClick:fe,class:de,...H}=r;if(!C())return null;const X=Y(()=>x()??500),ne=Y(()=>Q(h().devtoolsPanelContainer,h().devtoolsPanelContainerVisibility(!!v()),h().devtoolsPanelContainerResizing(S),h().devtoolsPanelContainerAnimation(j(),X()+16))),Ce=Y(()=>({height:`${X()}px`,...ie||{}})),pe=Y(()=>Q(h().mainCloseBtn,h().mainCloseBtnPosition(p),h().mainCloseBtnAnimation(!!v()),de));return B(Dt,{component:o,ref:i,class:"TanStackRouterDevtools",get children(){return[B(Bt.Provider,{value:{onCloseClick:K??(()=>{})},get children(){return B(hr,Ge({ref(D){var V=$;typeof V=="function"?V(D):$=D}},ae,{router:s,routerState:c,className:ne,style:Ce,get isOpen(){return j()},setIsOpen:y,handleDragStart:D=>G($,D),shadowDOMTarget:g}))}}),(()=>{var D=mr(),V=D.firstChild,W=V.firstChild,N=W.nextSibling,J=V.nextSibling,ee=J.nextSibling;return Qe(D,Ge(H,{"aria-label":"Open TanStack Router Devtools",onClick:I=>{y(!0),fe&&fe(I)},get class(){return pe()}}),!1,!0),u(W,B($t,{})),u(N,B($t,{})),F(I=>{var te=h().mainCloseBtnIconContainer,f=h().mainCloseBtnIconOuter,k=h().mainCloseBtnIconInner,M=h().mainCloseBtnDivider,P=h().routerLogoCloseButton;return te!==I.e&&d(V,I.e=te),f!==I.t&&d(W,I.t=f),k!==I.a&&d(N,I.a=k),M!==I.o&&d(J,I.o=M),P!==I.i&&d(ee,I.i=P),I},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),D})()]}})}export{yr as FloatingTanStackRouterDevtools,yr as default};
