// Regressão: o aluno guarda as próprias preferências em `<slug>:notifications`; o Admin não pode ler/escrever na mesma chave (20/11).
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/notifications-key-collision.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
;(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined});const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,200)))
// student sets a preference first (same community, same localStorage key family)
await p.goto("http://localhost:3000/c/kairo/profile",{waitUntil:"domcontentloaded"}).catch(()=>{});await p.waitForTimeout(2500)
console.log('student profile url',p.url())
const tab=p.getByRole('tab',{name:'Notifications'});console.log('student notif tab',await tab.count());if(await tab.count()){await tab.click();await p.waitForTimeout(400);const sw=p.getByRole('switch').first();await sw.click();await p.waitForTimeout(300)}
const keys=await p.evaluate(()=>Object.keys(localStorage).filter(k=>/notifications/.test(k)).map(k=>k+' => '+localStorage.getItem(k).slice(0,120)));console.log('keys',JSON.stringify(keys))
await p.goto("http://localhost:3000/admin/kairo/settings?tab=notifications",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3500)
console.log('admin page switches',await p.getByRole('switch').count(),'errors',JSON.stringify(errs))
await p.goto("http://localhost:3000/admin/kairo",{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000);await p.locator('button[aria-label^=Notifications]').click().catch(e=>console.log('bell click fail'));await p.waitForTimeout(500);
console.log('panel',await p.locator('[data-slot=notifications-panel]').count(),'errors',JSON.stringify(errs));await b.close()})()
