# GSC 2027 Handout + Room Collection — one link

This is your existing companion handout with anonymous room sharing added, so attendees scan **one QR all session**.

Your original six activities are untouched. Two optional blocks were added:

- **Activity 1** — a "Send to the room" button under the barrier tally. It sends only the checked barriers.
- **Activity 5** — a "Send this barrier to the panel" button under the barrier box, plus a lens picker. It sends only that text and the chosen lens. The four lens note fields are never sent.

Everything else still behaves as before, including Print, Download .txt, and Copy to clipboard. The Readiness Map is never transmitted.

| Page | Who uses it |
|---|---|
| `/` | Attendees. The handout, now with two optional share buttons. |
| `/results` | The projector. Live bar chart of barriers, refreshing every 3 seconds, and a clinic view showing only approved entries. |
| `/results` → **Facilitator** | One presenter, on a device that is *not* the projector. Shows every clinic submission with Show/Hide, plus Download CSV and Delete all data. |

What is stored: barrier IDs from the fixed list of 12, clinic text (280 characters max), the chosen lens, and a timestamp. No names, emails, districts, or IP addresses. Each browser gets a random ID so it can replace its own vote and so the 3-per-phone clinic limit works.

---

## Deploy to the SAME Vercel project

Deploying here keeps gsc2027-handout.vercel.app as the one link.

1. **Put these files in a folder** on your computer (the zip unpacks to one).
2. **Link and deploy.** In that folder, run:
   ```
   npx vercel
   ```
   When it asks, choose **Link to existing project** and pick `gsc2027-handout`. Then:
   ```
   npx vercel --prod
   ```
   If the handout deploys from a GitHub repo instead, copy these files over the repo's contents, commit, and push — Vercel deploys on push.
3. **Add storage.** In the Vercel project: **Storage → Create Database → Upstash for Redis** (Marketplace), free plan, connect it to this project. Vercel sets the environment variables itself.
4. **Set the facilitator key.** **Settings → Environment Variables** → add `ADMIN_KEY` with a passphrase only the four presenters know. Apply to Production.
5. **Redeploy** so the variables take effect: **Deployments → ⋯ → Redeploy**.
6. **Smoke test.** On your phone, open the handout, check a barrier, tap Send. Open `/results` on a laptop and confirm the bar moved. Unlock Facilitator, then press **Delete all data** twice to clear the test.

Local test with no storage: `node dev-server.js`, then open http://localhost:3000. It uses memory storage and accepts any facilitator key.

---

## Run of show

- **Before doors open:** `/results` on the projector laptop. The facilitator unlocks Facilitator mode on a **different** device — never on the projector, since that mode shows unapproved entries.
- **0:00, Activity 1:** attendees scan the QR, check their barriers, tap Send. Switch the projector to `/results`. Stuart narrates the top three.
- **0:49, Activity 5:** switch the projector to **Failure clinic**, which starts empty. Attendees type a barrier and send it. The facilitator taps **Show on screen** for 2 or 3 strong, non-identifying entries, and each presenter answers from their lens.
- **After the session:** Download CSV, then **Delete all data** (two clicks). Do it within a week so the "deleted after the conference" promise holds.

---

## Slide copy

**QR slide**
> **One link, all session. Sharing is optional and anonymous.**
> gsc2027-handout.vercel.app
> Work the six activities, build your Readiness Map, export before you leave.
> [QR to https://gsc2027-handout.vercel.app]

**Slide 22 fix**
> Interactive version: complete all six activities and **export** your map before you leave. Nothing is stored after you close the page.

---

## Notes

- 100 people polling every 3 seconds sits well inside the Upstash free tier.
- Abuse limits: one barrier vote per browser (resending replaces it), 3 clinic entries per browser, and no free text reaches the projector without facilitator approval.
- The projector page has no QR image — your deck's QR is the route in. The join URL shows as text in the corner.
- Not legal advice. If a presenter's organization has rules about collecting anything at conferences, check them before February.
