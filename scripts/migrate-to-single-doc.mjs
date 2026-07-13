// One-off: fold the deklarasi_officials + deklarasi_defaults + deklarasi_meta
// collections into the single aggregate doc deklarasi_state/main.
//
//   node --env-file=.env scripts/migrate-to-single-doc.mjs
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
const db = getFirestore()

const [offSnap, defSnap, evSnap] = await Promise.all([
  db.collection('deklarasi_officials').get(),
  db.collection('deklarasi_defaults').get(),
  db.doc('deklarasi_meta/event').get(),
])

const officials = offSnap.docs
  .map((d) => ({ id: d.id, ...d.data() }))
  .sort((a, b) => a.order - b.order)
const defaults = defSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
const event = evSnap.exists
  ? evSnap.data()
  : {
      title: 'Komitmen Bersama Pengelolaan Keuangan dan BMN',
      subtitle: 'Sekretariat Jenderal Dewan Perwakilan Rakyat Republik Indonesia',
      location: 'Ruang KK II',
      date: '2026-08-17',
      locked: false,
    }

await db.doc('deklarasi_state/main').set({ event, officials, defaults })
console.log(`migrated ${officials.length} officials, ${defaults.length} defaults`)
process.exit(0)
