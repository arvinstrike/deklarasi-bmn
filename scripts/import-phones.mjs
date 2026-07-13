// One-off: import phone numbers from a CSV (columns: nama, phone) into Firestore
// officials, matched by normalized name. Keeps personal numbers OUT of the repo.
//
//   node --env-file=.env scripts/import-phones.mjs /path/to/list_eselon.csv
//
// Get the CSV from the xlsx with:
//   soffice --headless --convert-to csv --outdir . /path/to/list_eselon.xlsx
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('usage: node --env-file=.env scripts/import-phones.mjs <csv>')
  process.exit(1)
}

function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') (text[i + 1] === '"') ? ((field += '"'), i++) : (inQ = false)
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') (row.push(field), (field = ''))
    else if (c === '\n') (row.push(field), rows.push(row), (row = []), (field = ''))
    else if (c !== '\r') field += c
  }
  if (field.length || row.length) (row.push(field), rows.push(row))
  return rows
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const rows = parseCSV(readFileSync(csvPath, 'utf8'))
const header = rows[0].map((h) => h.trim())
const iName = header.indexOf('nama')
const iPhone = header.indexOf('phone')
const phoneByName = new Map()
for (const r of rows.slice(1)) {
  if (r[iName]) phoneByName.set(norm(r[iName]), (r[iPhone] || '').trim())
}

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
const db = getFirestore()
const snap = await db.collection('deklarasi_officials').get()

const batch = db.batch()
let matched = 0
const unmatched = []
for (const d of snap.docs) {
  const phone = phoneByName.get(norm(d.data().name))
  if (phone) (batch.update(d.ref, { phone }), matched++)
  else unmatched.push(d.data().name)
}
await batch.commit()
console.log(`matched ${matched}/${snap.size}`)
if (unmatched.length) console.log('UNMATCHED:\n - ' + unmatched.join('\n - '))
process.exit(0)
