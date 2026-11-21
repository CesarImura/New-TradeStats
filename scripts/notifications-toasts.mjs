// Notificações 3/3: toasts (posição e sobreposição em 4 larguras, repetição substitui, some sozinho). T3 (acima do modal) é coberto pelo teste de ⌘K do roteiro manual.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/notifications-toasts.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const res=[];const ok=(n,c,x='')=>res.push((c?'OK   ':'FAIL ')+n+' '+x)
const rects=p=>p.evaluate(()=>{const ts=[...document.querySelectorAll('[data-sonner-toast]')].map(t=>{const r=t.getBoundingClientRect();return {x:r.x,y:r.y,r:r.right,b:r.bottom,txt:t.textContent.slice(0,40)}});const sw=[...document.querySelectorAll('div,nav')].find(e=>/Admin/.test(e.textContent)&&/Student/.test(e.textContent)&&getComputedStyle(e).position==='fixed');const s=sw&&sw.getBoundingClientRect();return {ts,sw:s&&{x:s.x,y:s.y,r:s.right,b:s.bottom},vw:innerWidth,vh:innerHeight}})
const hit=(a,b)=>!(a.r<=b.x||a.x>=b.r||a.b<=b.y||a.y>=b.b)
;(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});const BASE="http://localhost:3000"
for(const [w,h] of [[1440,900],[1024,768],[768,1024],[390,844]]){
 const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,150)))
 await p.goto(BASE+"/admin/kairo",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000)
 const rem=p.getByRole('button',{name:'Remind'});
 await rem.scrollIntoViewIfNeeded();await rem.click();await p.waitForTimeout(700)
 let m=await rects(p);ok(`T1 ${w}: toast aparece`,m.ts.length===1,m.ts[0]&&m.ts[0].txt)
 if(m.ts[0]){const t=m.ts[0];ok(`T1 ${w}: dentro da tela`,t.x>=0&&t.r<=w&&t.y>=0&&t.b<=h,JSON.stringify([Math.round(t.x),Math.round(t.y),Math.round(t.r),Math.round(t.b)]));if(m.sw)ok(`T1 ${w}: não cobre o seletor Admin/Student`,!hit({x:t.x,y:t.y,r:t.r,b:t.b},{x:m.sw.x,y:m.sw.y,r:m.sw.r,b:m.sw.b}),JSON.stringify(m.sw))}
 // T2 spam
 for(let i=0;i<6;i++){await rem.click({force:true}).catch(()=>{});await p.waitForTimeout(60)}
 await p.waitForTimeout(600);m=await rects(p);const dom=await p.evaluate(()=>document.querySelectorAll('[data-sonner-toast]').length)
 ok(`T2 ${w}: 7 cliques em Remind -> toasts no DOM`,dom<=3,String(dom)+' (idealmente 1: repetido deve substituir)')
 // T6 auto dismiss
 await p.waitForTimeout(5500);const after=await p.evaluate(()=>document.querySelectorAll('[data-sonner-toast]').length);ok(`T6 ${w}: some sozinho em ~6s`,after===0,String(after))
 // T7 reduced motion not tested here
 ok(`erros js ${w}`,errs.length===0,errs.join('|'));await ctx.close()}
console.log(res.join('\n'));await b.close()})()
