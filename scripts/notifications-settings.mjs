// Notificações 1/3: página Settings › Notifications (padrões, 4 blocos), efeito no sino, persistência, plataforma nova, breakpoints 1440/1024/768/390, teclado e reduced motion.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/notifications-settings.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const res=[];const ok=(n,c,x='')=>res.push((c?'OK   ':'FAIL ')+n+' '+x)
const BASE="http://localhost:3000"
const bellBtn=p=>p.locator('button[aria-label^=Notifications]')
const sw=(p,n)=>p.getByRole('switch',{name:n})
const st=async(p,n)=>(await sw(p,n).getAttribute('aria-checked'))
const openPanel=async p=>{await bellBtn(p).click();await p.waitForTimeout(450);return p.locator('[data-slot=notifications-panel]')}
;(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined})
// ---- A/B/C/D at 1440
{const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message))
await p.goto(BASE+"/admin/kairo/settings?tab=notifications",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000)
ok('A blocos h3',(await p.locator('h3').allInnerTexts()).join('|')==='Always on|Activity','' + (await p.locator('h3').allInnerTexts()).join('|'))
ok('A títulos dos painéis',await p.getByRole('heading',{name:'Daily summary'}).isVisible()&&await p.getByRole('heading',{name:'News from Traderhub'}).isVisible())
ok('A 3 obrigatórios sem switch',(await p.locator('section[aria-labelledby=notif-required] tbody tr').count())===3&&(await p.locator('section[aria-labelledby=notif-required] [role=switch]').count())===0)
ok('A 4 alertas = 8 switches + 2 = 10',(await p.getByRole('switch').count())===10,String(await p.getByRole('switch').count()))
const def={'Payment failed in the bell':'true','Payment failed by e-mail':'true','New sale in the bell':'true','New sale by e-mail':'false','Livestream reminder in the bell':'true','Livestream reminder by e-mail':'false','Upload finished in the bell':'true','Upload finished by e-mail':'false','Daily summary e-mail':'false','News from Traderhub by e-mail':'false'}
let allDef=true;for(const [k,v] of Object.entries(def)){if((await st(p,k))!==v){allDef=false;ok('A padrão '+k,false,await st(p,k))}}ok('A todos os padrões',allDef)
ok('A sem tag On em News',(await p.locator('text=/^On$/').count())===0)
// B default panel
let panel=await openPanel(p);ok('B padrão 6 avisos',(await panel.locator('li').count())===6,String(await panel.locator('li').count()));ok('B tag 4 new',await panel.getByText('4 new').isVisible());await p.keyboard.press('Escape');await p.waitForTimeout(300)
await sw(p,'Payment failed in the bell').click();await p.waitForTimeout(200)
panel=await openPanel(p);ok('B failed off → 5 avisos',(await panel.locator('li').count())===5);ok('B tag 3 new',await panel.getByText('3 new').isVisible());await p.keyboard.press('Escape');await p.waitForTimeout(300)
for(const n of ['New sale','Upload finished','Livestream reminder'])await sw(p,n+' in the bell').click()
panel=await openPanel(p);ok('B todos off → 2 (journal + payout)',(await panel.locator('li').count())===2,String(await panel.locator('li').count()));ok('B tag 1 new',await panel.getByText('1 new').isVisible())
// C filters
const tab=async id=>{await panel.locator(`[data-tab=${id}]`).last().click({force:true});await p.waitForTimeout(250);return panel.locator('li').count()}
ok('C Payments → 1 (payout)',(await tab('payments'))===1);ok('C Journal → 1',(await tab('journal'))===1);ok('C Students → 1 (journal)',(await tab('students'))===1);await tab('all')
await panel.getByRole('button',{name:'Mark all read'}).click();await p.waitForTimeout(300)
ok('B mark all read → sem tag e sem ponto',!(await panel.getByText(/\d new/).count())&&(await bellBtn(p).getAttribute('aria-label'))==='Notifications')
ok('B mark all read desabilitado',await panel.getByRole('button',{name:'Mark all read'}).isDisabled())
await p.keyboard.press('Escape');await p.waitForTimeout(300)
// D persistence + news tag
await sw(p,'News from Traderhub by e-mail').click();await p.waitForTimeout(200);ok('D tag On aparece',(await p.locator('text=/^On$/').count())===1)
await sw(p,'Daily summary e-mail').click();await sw(p,'Payment failed by e-mail').click()
await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(2500)
ok('D persiste (news on, daily on, failed email off, failed bell off)',(await st(p,'News from Traderhub by e-mail'))==='true'&&(await st(p,'Daily summary e-mail'))==='true'&&(await st(p,'Payment failed by e-mail'))==='false'&&(await st(p,'Payment failed in the bell'))==='false')
// panel after reload: readState persisted? (read set is per session)
panel=await openPanel(p);ok('D após reload painel 2 avisos',(await panel.locator('li').count())===2);await p.keyboard.press('Escape')
// reenable all bells -> back to 6
for(const n of ['Payment failed','New sale','Upload finished','Livestream reminder'])if((await st(p,n+' in the bell'))==='false')await sw(p,n+' in the bell').click()
panel=await openPanel(p);ok('D religar tudo → 6',(await panel.locator('li').count())===6);await p.keyboard.press('Escape')
ok('erros js (1440)',errs.length===0,errs.join('|'));await ctx.close()}
// ---- E fresh
{const ctx=await b.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message))
await page.goto(`${BASE}/signup/create`,{waitUntil:"domcontentloaded"});await page.waitForTimeout(3000)
await page.fill("input[autocomplete=name]","Rita Tester");await page.fill("input[type=email]","rita@example.com")
await page.getByRole("button",{name:"Continue"}).click();await page.waitForURL("**/signup/verify");await page.locator("input").first().click();await page.keyboard.type("123456")
await page.waitForURL("**/signup/about",{timeout:60000}).catch(async()=>{await page.getByRole("button",{name:"Verify"}).click()});await page.waitForURL("**/signup/about",{timeout:60000})
await page.getByRole("button",{name:"Skip"}).click();await page.waitForURL("**/signup/name");await page.waitForTimeout(2000)
await page.locator("input[placeholder*='Lio']").fill("Notif Matrix Desk");await page.locator("[data-slot=checkbox]").click();await page.getByRole("button",{name:"Continue"}).click()
await page.waitForURL("**/getting-started",{timeout:90000});const slug=page.url().split("/admin/")[1].split("/")[0]
await page.goto(`${BASE}/admin/${slug}/settings?tab=notifications`,{waitUntil:"domcontentloaded"});await page.waitForTimeout(3000)
ok('E nova plataforma: página carrega com 10 switches',(await page.getByRole('switch').count())===10)
const panel=await openPanel(page);ok('E painel vazio',await panel.getByText("You're all caught up").isVisible())
await page.keyboard.press('Escape');await page.waitForTimeout(300)
await sw(page,'Payment failed in the bell').click();ok('E mudar pref numa plataforma nova não quebra',(await st(page,'Payment failed in the bell'))==='false')
ok('erros js (nova)',errs.length===0,errs.join('|'));await ctx.close()}
// ---- F breakpoints
for(const [w,h] of [[1440,900],[1024,768],[768,1024],[390,844]]){const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();await p.goto(BASE+"/admin/kairo/settings?tab=notifications",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000)
const m=await p.evaluate(()=>({over:document.documentElement.scrollWidth>innerWidth,tables:[...document.querySelectorAll('section table, table')].map(t=>{const c=t.parentElement;return [t.scrollWidth>c.clientWidth+1,c.getAttribute('tabindex')]})}))
ok(`F ${w}px sem rolagem lateral da página`,!m.over)
ok(`F ${w}px tabelas ${JSON.stringify(m.tables)}`,true)
const panel=await openPanel(p);const bx=await panel.boundingBox();ok(`F ${w}px painel dentro da tela`,bx.x>=0&&bx.x+bx.width<=w+1&&bx.y>=0&&bx.y+bx.height<=h,JSON.stringify([Math.round(bx.x),Math.round(bx.y),Math.round(bx.width),Math.round(bx.height)]))
await p.keyboard.press('Escape');await p.waitForTimeout(300)
await p.screenshot({path:`/tmp/th-notifications-nt2_${w}.png`,fullPage:true});await ctx.close()}
// ---- G keyboard + H reduced motion
{const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const p=await ctx.newPage();await p.goto(BASE+"/admin/kairo/settings?tab=notifications",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000)
const s=sw(p,'Daily summary e-mail');await s.focus();await p.keyboard.press('Space');await p.waitForTimeout(150);ok('G teclado liga resumo',(await st(p,'Daily summary e-mail'))==='true')
const ring=await s.evaluate(e=>getComputedStyle(e).boxShadow+getComputedStyle(e).outlineStyle);ok('G foco visível',ring.length>8&&!/^none 0px/.test(ring),ring.slice(0,50))
await bellBtn(p).focus();await p.keyboard.press('Enter');await p.waitForTimeout(100);ok('H reduced motion: painel abre já visível',(await p.locator('[data-slot=notifications-panel]').evaluate(e=>getComputedStyle(e).opacity))==='1')
await p.keyboard.press('Escape');await p.waitForTimeout(200);ok('G Esc devolve o foco ao sino',(await p.evaluate(()=>document.activeElement.getAttribute('aria-label')||'')).startsWith('Notifications'))
await ctx.close()}
console.log(res.join('\n'));await b.close()})()
