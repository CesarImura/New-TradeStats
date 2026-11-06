// run-time shim (outside the product): the installed Chromium is /opt/pw-browsers/chromium, not the revision this playwright-core asks for
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require("playwright-core")
const launch = chromium.launch.bind(chromium)
chromium.launch = (o = {}) => launch({ args: ["--no-sandbox"], executablePath: "/opt/pw-browsers/chromium", ...o })
