// Run from studio: sanity exec import-menu.cjs --with-user-token
const {getCliClient} = require('sanity/cli')
const {readFileSync, createReadStream} = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')

const root = path.join(__dirname, '..')
const library = path.join(root, 'menu-review/step-4')
const inventory = JSON.parse(readFileSync(path.join(library, 'inventory.json'), 'utf8'))
const sections = readFileSync(path.join(root, 'CLIENT-MENU-STEP-1.md'), 'utf8').split('\n## ')
const table = index => sections[index].split(/\r?\n/).filter(line => /^\| \d\.\d/.test(line))
  .map(line => line.trim().slice(1, -1).split('|').map(cell => cell.trim()))
const tables = {flavors: table(1), drinks: table(2), extras: table(3), desserts: table(4)}
const collections = [
  ['eisbecher', 'Eisbecher'], ['kinderbecher', 'Kinderbecher'], ['spaghetti-eis', 'Spaghetti Eis'],
  ['eissorten', 'Eissorten'], ['getraenke', 'Shakes & Getränke'], ['extras', 'Extras'],
]
const prefix = 'eistaxi-2026-'
const collectionId = key => prefix + 'collection-' + key
const ref = key => ({_type: 'reference', _ref: collectionId(key), _weak: true, _strengthenOnPublish: {type: 'menuCollection'}})
const cents = text => {
  const match = /^(\d+),(\d{2})(?: €)?$/.exec(text)
  assert.ok(match, 'Invalid price: ' + text)
  return Number(match[1])*100 + Number(match[2])
}
const variant = (label, price, i) => ({_key: 'v'+i, _type: 'object', label, priceCents: cents(price)})
function product(item) {
  const {name, group, position, key} = item
  const rows = tables[group].filter(row => row[0].split(' ')[0] === position)
  assert.ok(rows.length && (group === 'extras' || rows[0][1] === name), 'Missing menu row: '+key)
  const row = rows[0]
  const doc = {_id: 'drafts.'+prefix+key, _type: 'menuProduct', name,
    slug: {_type: 'slug', current: key+'-'+name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')},
    position: Number(key.split('-')[1]), source: 'Seite '+(group==='desserts'?2:1)+' · '+position, available:false}
  let primary
  if (group === 'desserts') {
    primary = row[4] === '—' ? 'kinderbecher' : name.startsWith('SPAGHETTI') ? 'spaghetti-eis' : 'eisbecher'
    if (primary !== 'eisbecher') doc.otherCollections = [{...ref('eisbecher'), _key:'all-cups'}]
    doc.description = row[2].replace(/^([23])\/([46]) /,'$1 Kugeln bzw. $2 Kugeln: ')
    doc.variants = [variant('normal',row[3],0)]
    if (row[4] !== '—') doc.variants.push(variant('Mega',row[4],1))
    if (row[5] === 'mit Likör') doc.marks = [row[5]]
    else if (row[5] !== '—') doc.availabilityNote = row[5]
  } else if (group === 'drinks') {
    primary = 'getraenke'
    doc.description = row[2]
    doc.variants = row[3].split(' / ').map((size,i) => {
      const [,label,price] = /^(.*?) (\d+,\d{2} €)$/.exec(size)
      return variant(label,price,i)
    })
    if (name === 'MATCHA TIME') doc.options = [variant('-L-Milch','0,00',0),variant('Haferdrink','0,50',1)]
    if (name === 'ZITRONENFALTER') doc.options = [variant('Orangen-Saft','0,00',0),variant('Maracuja-Saft','0,00',1)]
  } else if (group === 'flavors') {
    primary = 'eissorten'
    doc.description = row[2]
    doc.marks = row[3].split(', ')
    doc.availabilityNote = doc.position <= 12 ? 'immer verfügbar' : 'wechselnd'
  } else {
    primary = 'extras'
    doc.variants = rows.map((r,i) => variant(r[1],r[2],i))
    if (position === '1.1') doc.otherCollections = [{...ref('eissorten'), _key:'flavors'}]
  }
  doc.primaryCollection = ref(primary)
  return doc
}
async function main() {
  const client = getCliClient({apiVersion:'2025-02-19'}).withConfig({useCdn:false,perspective:'raw'})
  const config = require('./project.json')
  assert.equal(client.config().dataset,config.dataset)
  assert.equal(client.config().projectId,config.projectId)
  const documents = collections.map(([key,name],i) => ({_id:'drafts.'+collectionId(key),_type:'menuCollection',
    name,slug:{_type:'slug',current:key},position:i+1}))
  const products = inventory.map(product)
  assert.equal(products.length,67)
  const all = [...documents,...products]
  const ids = all.map(doc=>doc._id)
  assert.equal(new Set(ids).size,73)
  const existing = await client.fetch('*[_id in $ids]._id',{ids:[...ids,...ids.map(id=>id.slice(7))]})
  const missing = doc => !existing.includes(doc._id) && !existing.includes(doc._id.slice(7))
  for (const [i,doc] of products.entries()) {
    if (!missing(doc)) continue
    const item = inventory[i]
    const filename = item.key+'-'+Math.max(...item.webWidths)+'.webp'
    const asset = await client.assets.upload('image',createReadStream(path.join(library,'web',filename)),{filename})
    doc.image = {_type:'image',asset:{_type:'reference',_ref:asset._id}}
  }
  const tx = client.transaction()
  const pending = all.filter(missing)
  for (const doc of pending) tx.createIfNotExists(doc)
  if (pending.length) await tx.commit({visibility:'sync'})
  const saved = await client.fetch('*[_id in $ids]{_id, name, variants, primaryCollection, "asset":image.asset->_id}',{ids})
  for (const doc of pending) {
    const record = saved.find(r=>r._id===doc._id)
    assert.equal(record?.name,doc.name)
    if(doc._type==='menuProduct') {
      assert.equal(record.asset,doc.image.asset._ref)
      assert.equal(record.primaryCollection._ref,doc.primaryCollection._ref)
      assert.deepEqual(record.variants??[],doc.variants??[])
    }
  }
  console.log('Created and verified '+pending.length+' drafts. Catalog drafts present: '+saved.length+'.')
}
main().catch(error=>{console.error(error.message);process.exitCode=1})
