// Notificações 2/3: sino (⌘K fecha o painel, clique marca lido e navega, lido persiste, comunidades isoladas, altura baixa, ordem do Tab).
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/notifications-bell.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const res=[];const ok=(n,c,x='')=>res.push((c?'OK   ':'FAIL ')+n+' '+x)
const BASE="http://localhost:3000"
const bell=p=>p.locator('button[aria-label^=Notifications]')
;(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined})
{const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,150)))
await p.goto(BASE+"/admin/kairo",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000)
// E1 palette closes the panel
await bell(p).click();await p.waitForTimeout(400);ok('E1 painel abre',await p.locator('[data-slot=notifications-panel]').isVisible())
await p.keyboard.press('Meta+k');await p.waitForTimeout(500);ok('E1 ⌘K fecha o painel e abre a busca',!(await p.locator('[data-slot=notifications-panel]').count())&&(await p.locator('[role=dialog]').count())>=1)
await p.keyboard.press('Escape');await p.waitForTimeout(300)
// E2 click each item -> navigates, marks read
const hrefs=['sales','journal','content','livestreams']
await bell(p).click();await p.waitForTimeout(400);const links=await p.locator('[data-slot=notifications-panel] li a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));ok('E2 6 links',links.length===6,links.join(','))
const unreadBefore=await bell(p).getAttribute('aria-label');
await p.locator('[data-slot=notifications-panel] li a').first().click();await p.waitForURL('**/sales',{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);ok('E2 clique navega para sales e fecha o painel',p.url().includes('/sales')&&!(await p.locator('[data-slot=notifications-panel]').count()),p.url())
ok('E2 contagem do sino caiu',(await bell(p).getAttribute('aria-label'))!==unreadBefore,unreadBefore+' -> '+await bell(p).getAttribute('aria-label'))
// E8 persistence of read after reload
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);ok('E8 lido persiste após recarregar',(await bell(p).getAttribute('aria-label'))==='Notifications, 3 new',await bell(p).getAttribute('aria-label'))
// every target route loads
for(const r of links){const resp=await p.goto(BASE+r,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1200);ok('E2 rota '+r+' abre',resp&&resp.status()===200&&!(await p.getByText(/Something went wrong|Application error/i).count()))}
// E12 isolation across communities
await p.goto(BASE+"/admin/kairo/settings?tab=notifications",{waitUntil:"domcontentloaded"});await p.waitForTimeout(2500)
await p.getByRole('switch',{name:'Payment failed in the bell'}).click();await p.waitForTimeout(200)
await p.goto(BASE+"/admin/northline/settings?tab=notifications",{waitUntil:"domcontentloaded"});await p.waitForTimeout(2500)
ok('E12 outra comunidade mantém o padrão',(await p.getByRole('switch',{name:'Payment failed in the bell'}).getAttribute('aria-checked'))==='true')
ok('erros js',errs.length===0,errs.join('|'));await ctx.close()}
// E4 short viewport: list scrolls, footer reachable
{const ctx=await b.newContext({viewport:{width:1440,height:480}});const p=await ctx.newPage();await p.goto(BASE+"/admin/kairo",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000)
await bell(p).click();await p.waitForTimeout(500)
const m=await p.evaluate(()=>{const pn=document.querySelector('[data-slot=notifications-panel]');const ul=pn.querySelector('ul');const r=pn.getBoundingClientRect();const f=[...pn.querySelectorAll('button,a')].find(x=>/Notification settings/.test(x.textContent)).getBoundingClientRect();return {panelBottom:Math.round(r.bottom),vh:innerHeight,scrolls:ul.scrollHeight>ul.clientHeight,footerVisible:f.bottom<=innerHeight&&f.top>=0}})
ok('E4 altura 480: painel cabe, lista rola, rodapé visível',m.panelBottom<=m.vh&&m.scrolls&&m.footerVisible,JSON.stringify(m));await ctx.close()}
// E6 keyboard order inside the panel
{const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();await p.goto(BASE+"/admin/kairo",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000)
await bell(p).focus();await p.keyboard.press('Enter');await p.waitForTimeout(500)
const seq=[];for(let i=0;i<14;i++){seq.push(await p.evaluate(()=>{const e=document.activeElement;return (e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,22)+(e.closest('[data-slot=notifications-panel]')?'':'*')}));await p.keyboard.press('Tab')}
ok('E6 ordem do Tab',true,JSON.stringify(seq))
ok('E6 todos os itens do painel alcançáveis por Tab',seq.filter(s=>!s.endsWith('*')).length>=9)
await ctx.close()}
console.log(res.join('\n'));await b.close()})()
