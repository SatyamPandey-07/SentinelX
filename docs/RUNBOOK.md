# Trying out SentinelX — a friendly guide

Hey! 👋 This is a guide to get SentinelX running on **your own computer** and click through everything yourself — no coding knowledge needed. Just follow the steps in order and copy-paste the commands exactly as written.

SentinelX is a practice project that simulates how a city's emergency dispatch system might work — reporting incidents (like a fire or accident), assigning responders, tracking them on a map, and so on. It's made of a website (what you'll click around in) and a bunch of background programs that power it.

Take your time, and don't worry if something looks scary — the [If something goes wrong](#if-something-goes-wrong) section at the bottom has you covered.

---

## What you need to install first

You only do this part once. Install these three programs, in this order:

1. **Docker Desktop** — this runs all the "behind the scenes" parts of the project (the database, the servers, etc.) in neat little sandboxes called *containers*, so you don't have to install any of that stuff by hand.
   Download it from **docker.com** → "Get Started" → download for your operating system (Windows or Mac) → install it like any other app → open it once so it finishes setting up. You'll see a whale icon 🐳 in your taskbar/menu bar when it's ready.

2. **Node.js** — this runs the website part.
   Download it from **nodejs.org** → pick the **LTS** version (the one recommended for most people) → install it with all the default options.

3. **Git** — this downloads the project's code onto your computer.
   Download it from **git-scm.com** → install it with all the default options.

Restart your computer after installing these three, just to be safe.

---

## Step 1 — Open a terminal

A "terminal" is just a plain black/white window where you type commands instead of clicking. It sounds intimidating but you're only ever going to copy-paste into it.

- **Windows:** press the Start button, type `PowerShell`, press Enter.
- **Mac:** press Cmd+Space, type `Terminal`, press Enter.

## Step 2 — Get the project

Copy this whole block, paste it into your terminal, and press Enter:

```
git clone https://github.com/SatyamPandey-07/SentinelX.git VIGIL
cd VIGIL
```

This downloads the project into a folder called `VIGIL` and moves you into it. Keep this terminal window open — you'll type more commands into this same window.

## Step 3 — Start the backend (the "engine room")

Make sure Docker Desktop is open (check for the whale icon 🐳). Then paste this:

```
docker compose --env-file .env -f infrastructure/docker/docker-compose.yml up -d ^
  postgres redis kafka opensearch ^
  auth-service incident-service search-service api-gateway ^
  grafana prometheus jaeger otel-collector kafka-ui opensearch-dashboards mailhog
```

You'll see a bunch of text scroll by — that's normal, it's downloading and starting everything. **The first time, this can take 5–10 minutes** because it's downloading a lot. Go make a tea. ☕

When it's done, type this to check everything's alive:

```
docker ps
```

You should see a list of about 14 things, each saying `Up ... (healthy)`. If a couple still say `(health: starting)`, just wait another minute or two and run `docker ps` again.

## Step 4 — Start the website

Open a **second** terminal window (leave the first one alone) and paste:

```
cd VIGIL/frontend
npm install
npm run dev
```

`npm install` only needs to happen the first time (it also takes a few minutes). Once you see a line that says `Ready`, the website is running.

## Step 5 — Open it in your browser

Go to **http://localhost:3000** in Chrome, Edge, or whatever browser you like.

You'll land on a login screen. You have two options:

- **Use the pre-made account:** username `admin`, password `Admin@12345`.
- **Or make your own account:** click the **SIGN UP** tab at the top of the login box, fill in your name/email/username/password, and it logs you straight in. (This is a real feature — try it, it's brand new!)

---

## Things to click around and try

Once you're logged in, here's a checklist of everything to poke at. Nothing here is fake — every click actually talks to a real backend.

- [ ] **Report an incident** — find the "Report Incident" / "New Incident" button, fill in a title, description, pick a category like Fire or Medical, and submit it.
- [ ] **See it appear** on the incident board/dashboard.
- [ ] **Search for it** using the search bar — type part of the title you used.
- [ ] **Open the incident** and try the Acknowledge and Resolve buttons — watch its status change.
- [ ] **Log out and sign up as a second person** (different username) to see it from someone else's point of view.
- [ ] Explore the other pages in the sidebar — Map, Responders, Analytics, Audit, SLA, System Health — click through all of them.

## Peeking behind the curtain (the dashboards)

These are the tools the actual engineers would use to keep an eye on the system. You don't need to understand them deeply — just open each one and have a look, it's genuinely satisfying to see the system "thinking" in real time.

| Open this | What you're looking at |
|---|---|
| **http://localhost:3001** (login: `admin` / `admin`) | **Grafana** — live graphs of how fast/healthy the system is. Go to Dashboards → "SentinelX Service Overview". Create an incident on the website and watch a graph move! |
| **http://localhost:16686** | **Jaeger** — shows the exact path a single click takes through all the different programs, like a flight tracker for your button-press. |
| **http://localhost:8095** | **Kafka UI** — every time an incident is created, a message gets sent here. Click "Topics" → `incident.created` → "Messages" to see them pile up. |
| **http://localhost:5601** | **OpenSearch Dashboards** — where the search feature's data actually lives. |
| **http://localhost:9090** | **Prometheus** — raw numbers/metrics, the more "nerdy" version of Grafana. |
| **http://localhost:8025** | **Mailhog** — a fake inbox. If the system ever tries to email someone, it lands here instead of a real inbox. |

---

## If something goes wrong

**"It's slow" / pages take forever to load:** Totally normal the first couple of minutes after starting everything — the programs are still waking up. Give it 2–3 minutes.

**A page shows an error, or won't load at all:**
1. Go back to your first terminal window and run `docker ps` — check everything still says `healthy`.
2. If something's missing, run the Step 3 command again — it's safe to re-run.
3. Try refreshing the browser page.

**Your computer feels like it's struggling / fans spinning loudly:** This project runs a lot of programs at once, which needs a fair amount of memory. If your computer only has 8GB of RAM, things might run slowly — that's expected, not something you broke. Closing other apps (especially Chrome with lots of tabs) helps a lot.

**You want to stop everything** (e.g., you're done for the day): go to your first terminal and run:

```
docker compose --env-file .env -f infrastructure/docker/docker-compose.yml stop
```

This pauses everything without deleting anything — running the Step 3 command again next time picks up right where you left off.

**You want to completely wipe it and start fresh:**

```
docker compose --env-file .env -f infrastructure/docker/docker-compose.yml down -v
docker system prune -a --volumes
```

**Something in this guide didn't work as described** — that's useful to know! Take a screenshot of the error and send it over so it can get fixed for the next person.

---

*Have fun exploring — you're running a genuinely real, working distributed system, not a demo with fake buttons. Everything you click actually does something on the backend.* 🚨
