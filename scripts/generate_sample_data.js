#!/usr/bin/env node
/**
 * Generate sample dataset for Heylock and write to src/app/api/chat/sample_data.json
 * Usage: node scripts/generate_sample_data.js [--users=25] [--days=30]
 */
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[randInt(0, arr.length - 1)]; }
function iso(date) { return new Date(date).toISOString(); }
function daysAgo(days) { return new Date(Date.now() - days * 24 * 60 * 60 * 1000); }

const args = process.argv.slice(2);
const opts = { users: 25, days: 30 };
for (const a of args) {
  if (a.startsWith('--users=')) opts.users = parseInt(a.split('=')[1], 10);
  if (a.startsWith('--days=')) opts.days = parseInt(a.split('=')[1], 10);
}

const users = [];
const sessions = [];

const planWeights = { free: 0.8, pro_monthly: 0.15, pro_yearly: 0.05 };
function pickPlan() {
  const r = Math.random();
  if (r < planWeights.free) return 'free';
  if (r < planWeights.free + planWeights.pro_monthly) return 'pro_monthly';
  return 'pro_yearly';
}

const devices = ['desktop', 'mobile'];
const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const oses = ['macOS', 'Windows', 'iOS', 'Android'];
const countries = ['US', 'DE', 'GB', 'FR', 'IN'];
const eventTypes = ['page_view','session_start','session_end','sign_up','confirm_email','sign_in','sign_out','create_item','share_item','lock_item','unlock_item','subscription_start','subscription_cancel','purchase','payment_failed','invite','search','click','feature_use'];

for (let i = 0; i < opts.users; i++) {
  const userId = randomUUID();
  const createdAt = daysAgo(randInt(1, opts.days));
  const emailHash = `user_${i}@example.com`;
  const plan = pickPlan();
  users.push({ userId, emailHash, plan, signupDate: iso(createdAt), isPaid: plan !== 'free' });
}

// identity anomaly: duplicate email across two new users
const dupEmail = 'duplicate@example.com';
users.push({ userId: randomUUID(), emailHash: dupEmail, plan: 'free', signupDate: iso(daysAgo(20)), isPaid: false });
users.push({ userId: randomUUID(), emailHash: dupEmail, plan: 'pro_monthly', signupDate: iso(daysAgo(10)), isPaid: true });

for (const user of users) {
  const sessionsCount = randInt(1, 5);
  for (let s = 0; s < sessionsCount; s++) {
    const sessionUUID = randomUUID();
    const sessionAgeDays = randInt(0, opts.days - 1);
    const startedAt = daysAgo(sessionAgeDays);
    const durationMin = randInt(1, 120);
    const endedAt = new Date(startedAt.getTime() + durationMin * 60 * 1000);
    const isBot = Math.random() < 0.05; // ~5% bots
    const device = choice(devices);
    const browser = choice(browsers);
    const os = choice(oses);
    const country = choice(countries);
    const userPlan = user.plan;

    const eventsCount = randInt(10, 60);
    const events = [];
    // session start
    events.push({ id: randomUUID(), type: 'session_start', timestamp: iso(startedAt) });
    for (let e = 1; e < eventsCount - 1; e++) {
      const offset = Math.random() * (endedAt.getTime() - startedAt.getTime());
      const ts = new Date(startedAt.getTime() + offset);
      const t = choice(eventTypes);
      const ev = {
        id: randomUUID(),
        type: t,
        timestamp: iso(ts),
        page: t === 'page_view' ? `/app/page-${randInt(1, 10)}` : undefined,
        elementId: t === 'click' ? `btn-${randInt(1, 20)}` : undefined,
        productId: t === 'purchase' ? `product_${randInt(1,5)}` : undefined,
        amount: t === 'purchase' ? randInt(199, 999) / 100 : undefined,
        currency: t === 'purchase' ? 'USD' : undefined,
      };
      if (Math.random() < 0.01) delete ev.id; // occasional corrupted event
      events.push(ev);
    }
    events.push({ id: randomUUID(), type: 'session_end', timestamp: iso(endedAt) });

    if (Math.random() < 0.08) {
      // abandoned signup
      events.push({ id: randomUUID(), type: 'sign_up', timestamp: iso(new Date(startedAt.getTime() + 10000)) });
    }
    if (Math.random() < 0.03) {
      // failed payment
      events.push({ id: randomUUID(), type: 'payment_failed', timestamp: iso(new Date(startedAt.getTime() + 20000)), amount: 199, currency: 'USD' });
    }

    sessions.push({
      sessionUUID,
      userId: user.userId,
      startedAt: iso(startedAt),
      endedAt: iso(endedAt),
      durationSec: Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
      device,
      browser,
      os,
      country,
      isBot,
      userPlan,
      events,
    });

    // overlapping session occasionally
    if (Math.random() < 0.05) {
      const otherStart = new Date(startedAt.getTime() + (durationMin / 2) * 60 * 1000);
      const otherEnd = new Date(otherStart.getTime() + randInt(1, 30) * 60 * 1000);
      sessions.push({
        sessionUUID: randomUUID(),
        userId: user.userId,
        startedAt: iso(otherStart),
        endedAt: iso(otherEnd),
        durationSec: Math.floor((otherEnd.getTime() - otherStart.getTime()) / 1000),
        device,
        browser,
        os,
        country,
        isBot: false,
        userPlan: user.plan,
        events: [
          { id: randomUUID(), type: 'session_start', timestamp: iso(otherStart) },
          { id: randomUUID(), type: 'page_view', timestamp: iso(new Date(otherStart.getTime() + 3000)), page: '/app/home' },
          { id: randomUUID(), type: 'session_end', timestamp: iso(otherEnd) }
        ],
      });
    }
  }
}

// add an ambiguous session without events
sessions.push({ sessionUUID: randomUUID(), userId: users[0].userId, startedAt: iso(daysAgo(3)), endedAt: iso(daysAgo(3)), durationSec: 0, device: 'mobile', browser: 'Safari', os: 'iOS', country: 'US', isBot: false, userPlan: users[0].plan, events: [] });

const out = { users, sessions };
const outPath = path.join(__dirname, '..', 'src', 'app', 'api', 'chat', 'sample_data.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log(`Wrote ${users.length} users and ${sessions.length} sessions to ${outPath}`);
process.exit(0);
