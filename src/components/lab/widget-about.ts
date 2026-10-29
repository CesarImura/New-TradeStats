/**
 * What each widget is and what it's for, for the review modal's About panel
 * (prototype only). Written from the widget code, the vault's widget notes and
 * the templates' default pages (Terminal, Atelier, Pulse).
 */
export type About = {
  what: string
  for: string
  best: string
  data: string
  layouts: Record<string, string>
}

export const ABOUT: Record<string, About> = {
  "page-header": {
    what: "The page's title, with a small label and an intro line.",
    for: "Tells the student which page they are on and what it is for.",
    best: "The top of any coach-made or module page. Terminal starts its Calendar, Courses and Community pages with it.",
    data: "The coach's own text.",
    layouts: { plain: "Left-aligned, for most pages.", centered: "Centred, for a landing-style page.", banner: "On a picture band, to open a page with the brand." },
  },
  "continue-lesson": {
    what: "The next lesson to watch, with how far along the course is.",
    for: "“What should I watch next?” One tap back into the course.",
    best: "Home, near the top. On by default in Terminal, Atelier and Pulse; Terminal also puts it on Courses.",
    data: "Course progress.",
    layouts: { progress: "Lesson name, play button and the course's steps.", cover: "Adds the lesson thumbnail.", card: "One row, when space is tight.", media: "A large cover with the title on it, as the page's lead." },
  },
  "course-progress": {
    what: "Every course with its progress; locked ones show the tier that opens them.",
    for: "“Where am I across the program, and what's next to unlock?”",
    best: "Home or the Courses page. Default in all three templates.",
    data: "Course progress and the student's tier.",
    layouts: { rings: "A ring per course, for two or three courses.", bars: "A list with bars, for many courses.", unlocks: "Only the next unlock and when it opens." },
  },
  "next-live": {
    what: "The next live session, call or workshop, today on a timeline, or the week ahead.",
    for: "“When is the next live, and can I make it?” Also sets a reminder.",
    best: "Home. Default in Terminal, Atelier and Pulse.",
    data: "The coach's calendar.",
    layouts: { countdown: "The next session with a live countdown.", timeline: "Today's sessions on a timeline.", week: "The week at a glance.", split: "A picture beside the countdown, for flagship lives." },
  },
  "econ-news": {
    what: "Rate decisions, CPI, NFP and the coach's no-trade marks, plus which sessions are open.",
    for: "“Is there news I shouldn't trade through today?”",
    best: "Home for day traders. Default in Terminal and Pulse.",
    data: "The economic calendar and the coach's no-trade rules.",
    layouts: { next: "The next high-impact release.", week: "This week's releases in a list.", sessions: "Which markets are open now.", timeline: "Today's releases on a timeline." },
  },
  "journal-pnl": {
    what: "The student's results from their journal: P&L, equity curve and edge.",
    for: "“Am I making money, and how do I compare to my coach's model?”",
    best: "Home or the Journal page. Default in Terminal and Pulse.",
    data: "The trading journal.",
    layouts: {
      curve: "Equity curve against the coach's model; the default.",
      bars: "Day by day, green and red.",
      heatmap: "A month calendar of results.",
      hero: "One big number, for a Star.",
      hours: "Which hours make or lose money.",
      compare: "You against the model, stat by stat.",
    },
  },
  "rules-followed": {
    what: "How well the student keeps the coach's rules.",
    for: "“Am I trading my plan?” Discipline before results.",
    best: "Home or Journal. Default in all three templates.",
    data: "The trading journal, checked against the coach's rules.",
    layouts: { radar: "One score on a gauge.", streak: "Days in a row without a broken rule.", rules: "Each rule with its score.", hero: "The score big, for a Star.", grid: "A heatmap of days and rules.", compare: "You against the group." },
  },
  "first-week": {
    what: "A short checklist that turns a new member into an active one.",
    for: "“What should I do in my first week?”",
    best: "Home for new students; it hides itself when done. Default in Atelier.",
    data: "Onboarding steps and course progress.",
    layouts: { steps: "Steps in a row.", ring: "A ring with the count done.", checklist: "A tickable list.", path: "The steps on a timeline." },
  },
  "my-rank": {
    what: "The student's place on the coach's leaderboard.",
    for: "“How do I stand against the group?”",
    best: "Home in competitive communities. Default in Pulse.",
    data: "The leaderboard (discipline score).",
    layouts: { trend: "Rank over time and where you sit.", podium: "The top three.", leaderboard: "The top list with you in it.", hero: "Your rank big.", compare: "You against the average." },
  },
  announcement: {
    what: "The coach's newest announcement.",
    for: "“What's new from my coach?”",
    best: "Home. Default in Atelier and Terminal.",
    data: "Community posts (announcements).",
    layouts: { plain: "Headline and a line of text.", post: "The full post with likes and replies.", line: "One row.", media: "With the post's picture." },
  },
  "community-feed": {
    what: "The newest posts from the coach's own feed, pinned first.",
    for: "“What's happening in the community?”",
    best: "Home or the Community page.",
    data: "Community posts.",
    layouts: { list: "The latest posts.", line: "One row with the newest." },
  },
  discord: {
    what: "An invite to the coach's Discord server.",
    for: "Brings students into the live chat.",
    best: "Home for Discord-based communities. Default in Pulse.",
    data: "The Discord server (members, activity).",
    layouts: { online: "Who's online and activity.", card: "The channels.", banner: "One row.", heatmap: "When the server is busiest.", join: "A join card for new members." },
  },
  "welcome-video": {
    what: "A personal welcome video from the coach.",
    for: "Makes the first visit personal and explains how the program works.",
    best: "Home for new students. Default in Atelier.",
    data: "The coach's video.",
    layouts: { side: "Video beside the text.", stacked: "Video on top.", minimal: "A quote with a play button." },
  },
  banner: {
    what: "A headline with a button, for an offer or a launch.",
    for: "Promotes one thing the coach wants students to see.",
    best: "Any page, usually high on Home.",
    data: "The coach's own text and link.",
    layouts: { headline: "Text and button.", picture: "With a picture.", slim: "One line." },
  },
  text: {
    what: "A heading and a paragraph, a quote, or numbered steps.",
    for: "Says something in the coach's own words.",
    best: "Any page.",
    data: "The coach's own text.",
    layouts: { plain: "Heading and paragraph.", quote: "A large quote.", steps: "Numbered steps." },
  },
  image: { what: "A picture of the coach's, with an optional caption.", for: "Shows something visual: a chart, a setup, a photo.", best: "Any page.", data: "An uploaded picture.", layouts: { cover: "Fills the card.", caption: "With a caption under it.", side: "Beside a text." } },
  button: { what: "One call to action.", for: "Book a call, open a link, join something.", best: "Any page, next to related content.", data: "The coach's link.", layouts: { filled: "Filled, for the main action.", outline: "Outlined, for a secondary one.", row: "One row with a line of text." } },
  embed: { what: "A video or a page from elsewhere: YouTube, Vimeo, a form.", for: "Brings outside content onto the page.", best: "Any page.", data: "An embed link.", layouts: { video: "A video player.", page: "A page or form.", row: "One row that opens it." } },
  hero: { what: "A big picture or video with a headline and a button.", for: "Opens a page with impact.", best: "The top of a coach-made page.", data: "The coach's picture or video and text.", layouts: { image: "Picture.", video: "Video.", split: "Picture beside the text." } },
  faq: { what: "Questions and answers, opened one at a time.", for: "Answers what students keep asking.", best: "A sales page, the onboarding or Help.", data: "The coach's questions and answers.", layouts: { list: "One column.", two: "Two columns.", row: "One row that opens the list." } },
  links: { what: "A list of links: tools, documents, pages.", for: "Puts the coach's resources one tap away.", best: "Home or a resources page.", data: "The coach's links.", layouts: { list: "A list.", tiles: "Tiles with icons.", row: "One row." } },
  countdown: { what: "A countdown to a date.", for: "Builds anticipation for a launch, a cohort start or a challenge.", best: "Home, before an event.", data: "A date the coach sets.", layouts: { big: "Big numbers.", line: "One line.", card: "With a line of text." } },
  "partner-links": {
    what: "Brokers, prop firms and tools the coach recommends.",
    for: "Shows the coach's partners and their offers.",
    best: "Home or a resources page. Default in Terminal.",
    data: "The coach's partner offers.",
    layouts: { list: "A list with the offer.", tiles: "A logo wall.", chips: "Compact chips." },
  },
  "latest-downloads": { what: "The newest files, with a link to all.", for: "“Are there new templates or indicators?”", best: "Home or the Downloads page.", data: "The downloads library.", layouts: { list: "A list with versions.", tiles: "Tiles by platform.", row: "One row with the newest." } },
  "ai-ask": {
    what: "A question box for the AI assistant, with one insight from the student's trades.",
    for: "“Why do I lose after lunch?” Quick answers from the coach's material and the journal.",
    best: "Home. Default in Pulse and Terminal.",
    data: "The coach's course material and the journal.",
    layouts: { search: "Just the question box.", chat: "An example exchange.", insight: "One insight from the trades." },
  },
  "book-call": { what: "Free times with the coach, booked in one tap.", for: "“When can I talk to my coach?”", best: "Home or the Coaching page.", data: "The coach's availability and the student's allowance.", layouts: { slots: "Time slots by day.", next: "The next free slot.", allowance: "Calls left this month.", split: "A picture beside the slots." } },
  drawdown: {
    what: "How close the account is to its loss limits.",
    for: "“How much room do I have before I break my limits?”",
    best: "Home or Journal for funded traders. Default in Terminal.",
    data: "The trading account (broker) and its limits.",
    layouts: { gauge: "Drawdown on a gauge.", bars: "Today's loss against the daily limit.", curve: "Balance against the floor.", hero: "What's left, big." },
  },
  "coach-feedback": { what: "Trade reviews waiting and answered.", for: "“Has my coach replied to my trades?”", best: "Home or the Coaching page.", data: "Review requests and replies.", layouts: { queue: "The queue of reviews.", latest: "The latest reply.", stats: "How many answered.", thread: "Replies on a timeline." } },
  upgrade: { what: "The student's tier next to the next one; shown only when there is one.", for: "Shows what the next tier adds.", best: "Home, lower down.", data: "The tiers and the student's plan.", layouts: { compare: "Both tiers side by side.", banner: "One row.", card: "The price of the next tier.", split: "A picture beside the offer." } },
  "coach-profile": { what: "The coach's photo, title, numbers and socials.", for: "Who the coach is, for new students.", best: "Home or a sales page.", data: "The coach's profile.", layouts: { card: "A card.", hero: "Large, as a page lead.", compact: "One row.", media: "On a picture." } },
  "recent-trades": { what: "The latest trades in a table you can sort and page through.", for: "“What did I just trade, and which trades made or lost the most?”", best: "The Journal page, or Home for active traders.", data: "The trading journal.", layouts: { table: "Full table; sort by time, R or P&L.", list: "A compact list for a narrow column." } },
  "open-positions": { what: "Trades still open, with their P&L moving live.", for: "“What am I in right now, and how is it doing?”", best: "Home during the session, for traders with a connected broker.", data: "The broker connection.", layouts: { table: "A table with entry and stop.", cards: "One card per position, for two or three trades." } },
  "r-distribution": { what: "How trade results spread across R multiples.", for: "“Do I cut losses at −1R and let winners run?”", best: "The Journal page.", data: "The trading journal.", layouts: { histogram: "The full spread as a histogram.", summary: "The average and two key counts." } },
  "pnl-by-instrument": { what: "Profit and loss per market.", for: "“Which markets should I keep, and which should I drop?”", best: "The Journal page.", data: "The trading journal.", layouts: { bars: "Bars from a centre line; hover a market.", table: "A table with trades and average." } },
  "pnl-by-weekday": { what: "Profit and loss per day of the week.", for: "“Are some days worse for me?”", best: "The Journal page.", data: "The trading journal.", layouts: { bars: "One bar per weekday.", heatmap: "Each day of the last weeks." } },
  "win-rate-trend": { what: "The share of winning trades over time.", for: "“Is my win rate getting better?”", best: "Home or Journal.", data: "The trading journal.", layouts: { trend: "Win rate with a 4W / 3M switch.", compare: "You next to the group." } },
  watchlist: { what: "The markets the student follows, with price and change.", for: "“How are my markets moving today?”", best: "Home, near the calendar.", data: "Market prices (delayed).", layouts: { list: "A list with a small trace.", tiles: "Tiles with a trace each." } },
  goals: { what: "This month's goals and how close each one is.", for: "“Am I on track with what I set out to do?”", best: "Home or Progress.", data: "Goals the coach or student sets, from the journal and courses.", layouts: { list: "Goals with progress bars.", rings: "A ring per goal." } },
  "trading-streak": { what: "Days in a row with every rule kept, on a month calendar.", for: "“How consistent have I been?”", best: "Home or Progress.", data: "The trading journal against the coach's rules.", layouts: { month: "The month as a calendar.", streak: "Just the current streak." } },
  "check-in": { what: "A quick mood and sleep check before trading.", for: "“Am I in a state to trade today?” Logs it in the journal.", best: "Home, at the top during the session.", data: "What the student enters; saved to the journal.", layouts: { mood: "Mood and sleep.", notes: "Adds a plan for the day." } },
  leaderboard: { what: "The group's leaderboard as a table, with the student's own row marked.", for: "“Where do I stand, and who's ahead of me on discipline?”", best: "Home or Progress in competitive communities. The existing Ranking stays for the chart views.", data: "The leaderboard (discipline score, win rate, R).", layouts: { table: "Top traders with score, win rate, R and a trend; sort by any.", compact: "The top few with your own row pinned under them." } },
}
