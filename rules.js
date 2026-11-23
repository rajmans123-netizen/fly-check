// Fly Check rules: can I carry this on a flight in India? Cabin bag vs check-in bag, item by item.
// Sources (checked 23 Nov 2026):
//   K: BCAS's indicative list of prohibited items, as published on an Indian airport's own page (Kannur International Airport, "Security").
//      BCAS's own site (bcasindia.gov.in) has the categories but no item tables yet ("updates soon").
//   D: DGCA Dangerous Goods Advisory on power banks, reported 4 Jan 2026: no charging devices from a power bank on board, no charging
//      it from the seat, power banks and spare lithium batteries in hand baggage only and not in overhead bins.
//   I: IATA / ICAO lithium battery limits for passengers: spare batteries and power banks up to 100 Wh in cabin baggage; 100-160 Wh
//      only with the airline's approval, at most two; over 160 Wh not on passenger planes.
// Where sources disagree, the safe answer wins: nail cutters check-in only, coconut (fresh, dry or desiccated) not at all (Raj, 23 Nov 2026).
// Liquid medicines and baby food stay "ask".
// Verdicts: yes · no · limit (allowed within a limit: 100 ml in the cabin, 5 L in check-in) · ask (depends on the airline or needs approval)

export const SOURCES = {
  K: { name: 'BCAS prohibited items (indicative list on Kannur Airport\'s site)', url: 'https://kannurairport.aero/corporate/security' },
  D: { name: 'DGCA advisory on power banks (Jan 2026)', url: 'https://www.wionews.com/india-news/dgca-prohibits-use-of-power-banks-for-in-flight-here-s-all-you-need-to-know-1767541456299' },
  I: { name: 'IATA lithium battery rules for passengers', url: 'https://www.iata.org/en/programs/cargo/dgr/lithium-batteries/' },
};

const LIQ = 'Liquids, gels, creams and sprays: up to 100 ml per bottle in the cabin, all in one clear 1-litre bag. Bigger bottles go in check-in.';

// kind: battery | liquid | solid | device | other.   w: the words that name it on a pack or in a search (lower case)
export const ITEMS = [
  // ---- batteries (worked out from the label: see checkBattery)
  { id: 'powerbank', name: 'Power bank', kind: 'battery', w: ['power bank', 'powerbank', 'power-bank', 'portable charger', 'mah', 'wh'], src: 'DIK' },
  { id: 'spare', name: 'Spare lithium battery', kind: 'battery', w: ['spare battery', 'laptop battery', 'camera battery', 'lithium battery', 'li-ion battery', 'li-ion', 'lithium ion', 'li-polymer', '18650'], src: 'DIK',
    note: 'The battery inside your phone, laptop or camera is fine. This is about spare ones.' },
  // ---- devices
  { id: 'devices', name: 'Phone, laptop, tablet, camera', kind: 'device', w: ['phone', 'mobile', 'laptop', 'ipad', 'camera', 'earbuds', 'earphones', 'airpods', 'headphones', 'smartwatch', 'kindle', 'trimmer', 'charger', 'adapter', 'speaker'],
    cabin: 'yes', checkin: 'limit', checkinTag: 'If off', checkinNote: 'Only switched fully off and well padded. Better in your cabin bag.',
    why: 'Devices with their battery inside can fly. Laptops come out of the bag at the X-ray.', src: 'I' },
  { id: 'ecig', name: 'E-cigarette / vape', kind: 'other', w: ['e-cigarette', 'e cigarette', 'ecigarette', 'vape', 'vaporizer', 'vapouriser', 'juul'],
    cabin: 'no', checkin: 'no', why: 'Banned in both bags. E-cigarettes are also banned for sale in India.', src: 'K' },
  // ---- fire
  { id: 'lighter', name: 'Lighter', kind: 'other', w: ['lighter', 'cigarette lighter', 'zippo'], cabin: 'no', checkin: 'no',
    why: 'Not allowed in either bag. Lighters are the item Indian airport security takes most often.', src: 'K' },
  { id: 'matches', name: 'Matchbox', kind: 'other', w: ['matchbox', 'match box', 'matches', 'safety matches', 'maachis', 'machis'], cabin: 'no', checkin: 'no',
    why: 'Safety matches and strike-anywhere matches are banned in both bags.', src: 'K' },
  { id: 'camphor', name: 'Camphor (kapoor)', kind: 'solid', w: ['camphor', 'kapoor', 'kapur', 'karpur'], cabin: 'no', checkin: 'no',
    why: 'Camphor catches fire easily. It\'s banned in both bags, even for puja.', src: 'K' },
  { id: 'crackers', name: 'Firecrackers, sparklers, party poppers', kind: 'other', w: ['firecracker', 'fire cracker', 'crackers', 'sparkler', 'phuljhadi', 'party popper', 'bang snaps', 'fireworks'],
    cabin: 'no', checkin: 'no', why: 'Explosives: banned in both bags.', src: 'K' },
  { id: 'copra', name: 'Dry coconut (copra / khopra)', kind: 'solid', w: ['dry coconut', 'dried coconut', 'desiccated coconut', 'dessicated coconut', 'coconut powder', 'grated coconut', 'copra', 'kopra', 'khopra', 'khobra', 'sukha nariyal', 'nariyal burada', 'coconut flakes'],
    cabin: 'no', checkin: 'no', why: 'Dry coconut is oily and can catch fire. BCAS banned it in both bags in 2022, and desiccated (powdered) coconut is dry coconut too.', src: 'K' },
  { id: 'coconut', name: 'Fresh coconut', kind: 'solid', w: ['coconut', 'fresh coconut', 'nariyal'], cabin: 'no', checkin: 'no',
    why: 'Leave coconuts at home: dry coconut is banned in both bags, and fresh ones get stopped too. Not worth the risk.', src: 'K' },
  { id: 'flammable', name: 'Paint, thinner, petrol, kerosene', kind: 'liquid', w: ['paint', 'thinner', 'petrol', 'kerosene', 'diesel', 'turpentine', 'spray paint'], cabin: 'no', checkin: 'no',
    why: 'Flammable liquids, paints and thinners are banned in both bags.', src: 'K' },
  { id: 'gas', name: 'Gas cylinder, butane, lighter refill', kind: 'other', w: ['gas cylinder', 'butane', 'lighter fluid', 'lighter refill', 'camping gas'], cabin: 'no', checkin: 'no',
    why: 'Flammable gas and lighter fluid are banned.', src: 'K' },
  { id: 'insect', name: 'Insect killer spray (Hit, Baygon)', kind: 'liquid', w: ['insect killer', 'insecticide', 'mosquito spray', 'cockroach spray', 'hit spray', 'baygon', 'pesticide'], cabin: 'no', checkin: 'no',
    why: 'It\'s a pesticide: banned in check-in, and too big and too toxic for the cabin.', src: 'K' },
  // ---- liquids (100 ml in the cabin)
  { id: 'perfume', name: 'Perfume, deo, body spray', kind: 'liquid', w: ['perfume', 'parfum', 'eau de', 'cologne', 'deodorant', 'deo', 'body spray', 'antiperspirant', 'attar', 'ittar', 'itra', 'fragrance'],
    cabin: 'limit', checkin: 'yes', why: LIQ, src: 'K' },
  { id: 'toiletries', name: 'Shampoo, lotion, toothpaste, sanitizer', kind: 'liquid',
    w: ['shampoo', 'conditioner', 'lotion', 'moisturiser', 'moisturizer', 'sunscreen', 'sunblock', 'face wash', 'facewash', 'body wash', 'shower gel', 'toothpaste', 'hair oil', 'hair gel', 'serum', 'sanitizer', 'sanitiser', 'mouthwash', 'lens solution', 'aloe vera gel', 'cream', 'face cream', 'hand cream', 'shaving foam', 'shaving gel', 'hair spray', 'liquid soap', 'foundation', 'mascara', 'lip gloss', 'nail polish', 'repellent cream', 'gel', 'ointment', 'balm', 'vaseline', 'petroleum jelly', 'vaporub', 'vapourub'],
    cabin: 'limit', checkin: 'yes', why: LIQ, src: 'K' },
  { id: 'water', name: 'Water bottle', kind: 'liquid', w: ['water bottle', 'drinking water', 'mineral water', 'packaged drinking water', 'water', 'bottle', 'paani', 'pani'], cabin: 'limit', checkin: 'yes',
    head: 'Carry it empty', cabinNote: 'Empty only. Fill it after security.',
    why: 'A full bottle won\'t pass security. Carry it empty and fill it after security.', src: 'K' },
  { id: 'ghee', name: 'Ghee', kind: 'liquid', w: ['ghee', 'cow ghee', 'desi ghee', 'clarified butter'], cabin: 'limit', checkin: 'limit', checkinMax: 5000, checkinTag: '≤5 kg', checkinNote: 'Up to 5 kg / 5 litres, sealed.',
    why: 'Ghee counts as a liquid at security. Up to 100 ml in the cabin; up to 5 kg in check-in.', src: 'K' },
  { id: 'oil', name: 'Coconut oil, cooking oil', kind: 'liquid', w: ['coconut oil', 'cooking oil', 'mustard oil', 'sunflower oil', 'groundnut oil', 'olive oil', 'til oil', 'sesame oil', 'edible oil', 'oil', 'tel', 'sarson tel'],
    cabin: 'limit', checkin: 'limit', checkinMax: 5000, checkinTag: '≤5 L', checkinNote: 'Up to 5 litres, sealed.', why: 'Oil is a liquid: up to 100 ml in the cabin. BCAS allows up to 5 litres of coconut oil in check-in.', src: 'K' },
  { id: 'pickle', name: 'Pickle (achar)', kind: 'liquid', w: ['pickle', 'achar', 'achaar', 'aachar'], cabin: 'limit', checkin: 'yes', checkinNote: 'Yes, in a sealed, leak-proof jar.',
    why: 'Pickle is oily, so it counts as a liquid in the cabin: 100 ml at most. Pack bigger jars in check-in, sealed in a plastic bag.', src: 'K' },
  { id: 'spread', name: 'Honey, jam, curd, chutney, sauce', kind: 'liquid', w: ['honey', 'jam', 'curd', 'dahi', 'yogurt', 'yoghurt', 'chutney', 'ketchup', 'sauce', 'peanut butter', 'nutella', 'mayonnaise', 'syrup'],
    cabin: 'limit', checkin: 'yes', why: 'Anything you can spread or pour counts as a liquid at security: 100 ml per jar in the cabin.', src: 'K' },
  { id: 'syrupsweets', name: 'Rasgulla, gulab jamun (sweets in syrup)', kind: 'liquid', w: ['rasgulla', 'rasagola', 'gulab jamun', 'rasmalai', 'ras malai', 'sweets in syrup', 'jamun', 'angoori'],
    cabin: 'limit', checkin: 'yes', checkinNote: 'Yes, in a sealed tin.', why: 'The syrup counts as a liquid, so a tin of rasgulla won\'t pass in the cabin. Dry sweets are fine.', src: 'K' },
  { id: 'alcohol', name: 'Alcohol (whisky, rum, wine, beer)', kind: 'liquid', w: ['whisky', 'whiskey', 'rum', 'vodka', 'gin', 'wine', 'beer', 'brandy', 'liquor', 'alcohol', 'scotch', 'tequila', 'daru', 'daaru', 'sharab', 'sharaab'],
    cabin: 'limit', checkin: 'limit', checkinMax: 5000, checkinTag: '≤5 L', checkinNote: 'Up to 5 litres, sealed.', why: 'Up to 100 ml in the cabin (duty-free bought after security comes sealed in its own bag). Up to 5 litres in check-in.', src: 'K' },
  { id: 'medsliquid', name: 'Liquid medicine, eye drops, insulin', kind: 'liquid', w: ['cough syrup', 'liquid medicine', 'medicine syrup', 'eye drops', 'eye drop', 'insulin', 'nasal spray', 'inhaler'],
    cabin: 'ask', checkin: 'yes', why: 'Medicines you need on the flight are usually allowed over 100 ml. Carry the prescription and show it at security.', src: 'K' },
  { id: 'babyfood', name: 'Baby food, formula, milk for a baby', kind: 'liquid', w: ['baby food', 'formula', 'infant milk', 'baby milk', 'cerelac'], cabin: 'ask', checkin: 'yes',
    why: 'Usually allowed for a baby in sensible amounts. Security may ask to check it.', src: 'K' },
  { id: 'liquid', name: 'A liquid, cream or gel', kind: 'liquid', w: ['liquid', 'gel'], cabin: 'limit', checkin: 'yes', why: LIQ, src: 'K' },
  // ---- solid food
  { id: 'spices', name: 'Spices, masala, chilli powder', kind: 'solid',
    w: ['spices', 'spice', 'masala', 'chilli', 'chili', 'mirchi', 'mirch', 'haldi', 'turmeric', 'garam masala', 'chilli powder', 'red chilli', 'pepper powder', 'kali mirch', 'jeera', 'cumin', 'dhania', 'coriander powder', 'hing', 'asafoetida', 'sambar powder', 'chaat masala', 'pav bhaji masala', 'biryani masala', 'cardamom', 'elaichi', 'cloves', 'laung', 'cinnamon', 'dalchini', 'saffron', 'kesar', 'saunf', 'fennel', 'thecha', 'chutney powder', 'red chilli garlic', 'mirchi powder', 'ajwain', 'methi', 'rai', 'mustard seeds', 'black pepper', 'pepper', 'tej patta', 'bay leaf', 'star anise'],
    cabin: 'no', checkin: 'yes', why: 'BCAS bans all spices in the cabin bag, powdered or whole, chilli included. Pack them in check-in.', src: 'K' },
  { id: 'powders', name: 'Salt, sugar, atta, besan', kind: 'solid', w: ['salt', 'iodised salt', 'iodized salt', 'sugar', 'atta', 'flour', 'maida', 'besan', 'rice flour', 'sooji', 'suji', 'rava', 'baking soda', 'jaggery', 'gud', 'cornflour', 'namak', 'cheeni', 'chini', 'shakkar', 'powder'],
    cabin: 'yes', checkin: 'yes',
    why: 'They\'re not on BCAS\'s banned list. White powders can get a second look at security, so keep them sealed in the shop pack.',
    tip: 'Flying to the US, Australia or New Zealand? Powders over 350 ml go in check-in there.', src: 'K' },
  { id: 'protein', name: 'Protein powder, whey', kind: 'solid', w: ['protein', 'whey', 'mass gainer', 'creatine', 'pre workout', 'pre-workout', 'bcaa'], cabin: 'yes', checkin: 'yes',
    why: 'Allowed in both bags. Security may open the tub, so carry it sealed or in its labelled pack.', src: 'K' },
  { id: 'tea', name: 'Tea, coffee powder', kind: 'solid', w: ['tea', 'chai', 'chai patti', 'coffee', 'coffee powder', 'filter coffee', 'instant coffee', 'green tea'], cabin: 'yes', checkin: 'yes',
    why: 'Dry tea and coffee are fine in both bags. A filled flask isn\'t: that\'s a liquid.', src: 'K' },
  { id: 'dryfood', name: 'Namkeen, chips, biscuits, dry fruits, mithai', kind: 'solid',
    w: ['namkeen', 'bhujia', 'chips', 'wafers', 'biscuits', 'cookies', 'dry fruits', 'almonds', 'badam', 'cashew', 'kaju', 'raisins', 'kishmish', 'nuts', 'mithai', 'laddoo', 'ladoo', 'barfi', 'kaju katli', 'chocolate', 'cake', 'bread', 'thepla', 'khakhra', 'chakli', 'chikki', 'snacks', 'sweets', 'tiffin', 'homemade food', 'roti', 'chapati', 'paratha', 'poha', 'sandwich', 'maggi', 'instant noodles', 'cereal', 'muesli', 'makhana'],
    cabin: 'yes', checkin: 'yes', why: 'Dry food is fine in both bags. Anything with gravy or syrup counts as a liquid in the cabin.', src: 'K' },
  { id: 'fruit', name: 'Fresh fruit', kind: 'solid', w: ['fruit', 'fruits', 'mango', 'apple', 'banana', 'orange', 'grapes', 'chikoo', 'guava'], cabin: 'yes', checkin: 'yes',
    why: 'Fine on flights within India.', tip: 'Flying abroad? Many countries don\'t let fresh fruit through customs.', src: 'K' },
  // ---- sharp things and tools (check-in only)
  { id: 'scissors', name: 'Scissors', kind: 'other', w: ['scissors', 'scissor', 'kainchi'], cabin: 'no', checkin: 'yes', why: 'Not in the cabin bag. Fine in check-in.', src: 'K' },
  { id: 'knife', name: 'Knife (any size)', kind: 'other', w: ['knife', 'knives', 'penknife', 'pen knife', 'swiss knife', 'blade knife', 'chaku', 'chaaku'], cabin: 'no', checkin: 'yes',
    why: 'Knives with a blade of any length can\'t go in the cabin. Fine in check-in.', src: 'K' },
  { id: 'blades', name: 'Razor blades', kind: 'other', w: ['razor blade', 'razor blades', 'blades', 'blade'], cabin: 'no', checkin: 'yes', why: 'Loose razor blades can\'t go in the cabin. Fine in check-in.', src: 'K' },
  { id: 'nailcutter', name: 'Nail cutter', kind: 'other', w: ['nail cutter', 'nail clipper', 'nail clippers', 'nailcutter'], cabin: 'no', checkin: 'yes',
    why: 'Security takes nail cutters out of cabin bags, especially ones with a little knife or file. Pack it in check-in.', src: 'K' },
  { id: 'needles', name: 'Knitting needles', kind: 'other', w: ['knitting needle', 'knitting needles', 'crochet'], cabin: 'no', checkin: 'yes', why: 'Not in the cabin bag. Fine in check-in.', src: 'K' },
  { id: 'tools', name: 'Screwdriver, hammer, tools', kind: 'other', w: ['screwdriver', 'screw driver', 'hammer', 'spanner', 'wrench', 'pliers', 'tool kit', 'toolkit', 'drill'], cabin: 'no', checkin: 'yes', why: 'Tools can\'t go in the cabin. Fine in check-in.', src: 'K' },
  { id: 'cutlery', name: 'Steel cutlery with sharp edges', kind: 'other', w: ['cutlery', 'steel knife', 'fork'], cabin: 'no', checkin: 'yes', why: 'Metal cutlery with sharp edges can\'t go in the cabin.', src: 'K' },
  { id: 'bat', name: 'Cricket bat, hockey stick', kind: 'other', w: ['cricket bat', 'bat', 'hockey stick', 'baseball bat'], cabin: 'no', checkin: 'yes', why: 'Sports bats can\'t go in the cabin. Check it in.', src: 'K' },
  { id: 'darts', name: 'Darts, martial arts gear', kind: 'other', w: ['darts', 'dart', 'nunchaku', 'nunchucks'], cabin: 'no', checkin: 'yes', why: 'Not in the cabin bag. Fine in check-in.', src: 'K' },
  // ---- other
  { id: 'meds', name: 'Medicines (tablets, capsules)', kind: 'solid', w: ['medicine', 'medicines', 'tablet', 'tablets', 'capsule', 'capsules', 'dawai', 'dawa', 'paracetamol', 'vitamins'], cabin: 'yes', checkin: 'yes',
    why: 'Tablets and capsules are fine in both bags. Keep them in their strips, and carry the prescription for anything strong. Liquid medicines are a separate item.', src: 'K' },
  { id: 'makeup', name: 'Lipstick, lip balm, kajal (solid make-up)', kind: 'solid', w: ['lipstick', 'lip balm', 'lipbalm', 'chapstick', 'kajal', 'kohl', 'compact', 'face powder', 'eyeliner pencil', 'solid perfume', 'deodorant stick', 'roll on'],
    cabin: 'yes', checkin: 'yes', why: 'Solid make-up is fine in both bags. Liquid foundation, mascara and lip gloss count as liquids: 100 ml each in the cabin.', src: 'K' },
  { id: 'cigarettes', name: 'Cigarettes', kind: 'other', w: ['cigarette', 'cigarettes', 'bidi', 'beedi'], cabin: 'yes', checkin: 'yes',
    why: 'You can carry them, but not the lighter or matches. Smoking on board is banned.', src: 'K' },
  { id: 'glue', name: 'Glue, Fevikwik, adhesives', kind: 'other', w: ['fevikwik', 'feviquick', 'super glue', 'superglue', 'adhesive', 'glue', 'fevicol'], cabin: 'ask', checkin: 'no',
    why: 'Adhesives are banned in check-in. A small tube in the cabin may or may not pass: ask your airline.', src: 'K' },
  { id: 'dryice', name: 'Dry ice', kind: 'other', w: ['dry ice'], cabin: 'ask', checkin: 'ask', why: 'Only with the airline\'s approval, up to 2.5 kg.', src: 'K' },
];
// words that name the thing in a search, but on a label mean something else ("Customer care phone", "Protein 5 g" in the nutrition
// table, "stainless steel blades" on a trimmer): searched, never matched on a scanned label
const SEARCH_ONLY = new Set(['phone', 'mobile', 'camera', 'laptop', 'tablet', 'tablets', 'ipad', 'earbuds', 'earphones', 'airpods', 'headphones', 'smartwatch', 'kindle', 'trimmer', 'charger', 'adapter', 'speaker',
  'tel', 'bottle', 'pani', 'paani', 'powder', 'rai', 'pepper', 'compact', 'medicine', 'medicines', 'capsule', 'capsules', 'cereal',
  'bat', 'blade', 'blades', 'fork', 'dart', 'darts', 'water', 'oil', 'protein', 'gel', 'liquid', 'parfum', 'fragrance', 'mah', 'wh']);
// things that are often an ingredient of something else (oil in pickle, butane in a deo, salt in namkeen): on a label they only win
// when nothing more specific is named
const WEAK = new Set(['coconut', 'oil', 'water', 'spices', 'powders', 'alcohol', 'liquid', 'fruit', 'gas', 'spread', 'flammable', 'meds']);   // spices get a small bonus over other weak items: a chilli chutney is a chilli product
export const POPULAR = [['powerbank', 'Power bank'], ['perfume', 'Perfume'], ['ghee', 'Ghee'], ['spices', 'Masala'], ['powders', 'Salt & sugar'], ['pickle', 'Achar'], ['copra', 'Dry coconut'], ['lighter', 'Lighter'], ['nailcutter', 'Nail cutter'], ['protein', 'Protein powder'], ['bat', 'Cricket bat'], ['syrupsweets', 'Rasgulla']];
export const byId = id => ITEMS.find(i => i.id === id);

// ---------------------------------------------------------------- reading a label
// OCR often reads O for 0 and l / I for 1 inside numbers
export function cleanNumbers(t) {
  return String(t || '').replace(/\d[\dOo]+/g, m => m.replace(/[Oo]/g, '0')).replace(/(?<=\d)[lI|](?=\d)/g, '1');
}
const num = s => parseFloat(String(s).replace(/,/g, '').replace(/\s+/g, ''));

// A power bank's label: Wh if printed, otherwise mAh × the battery's voltage (the 3.6-3.85 V cell figure; 3.7 V if not printed)
export function readBattery(text) {
  const t = cleanNumbers(text);
  const whs = [...t.matchAll(/(\d{1,3}(?:[.,]\d{1,2})?)\s*W\s*h\b/gi)].filter(m => !/m\s*$/i.test(t.slice(Math.max(0, m.index - 1), m.index))).map(m => num(m[1].replace(',', '.'))).filter(v => v >= 1 && v <= 600);
  const mahs = [...t.matchAll(/(\d{1,3}(?:[,.\s]\d{3})+|\d{3,6})\s*m\s*a\s*h/gi)].map(m => num(m[1].replace(/[.\s]/g, ','))).filter(v => v >= 300 && v <= 200000);
  const volts = [...t.matchAll(/(\d(?:[.,]\d{1,2})?)\s*V(?![a-z])/gi)].map(m => num(m[1].replace(',', '.'))).filter(v => v >= 3.0 && v <= 4.45);
  const mah = mahs.length ? Math.max(...mahs) : null, v = volts.length ? Math.max(...volts) : null;
  let wh = whs.length ? Math.max(...whs) : null, from = 'wh';
  // a printed Wh that doesn't fit the mAh (174 for 74, 7.4 for 74) is a misread: work it out from the mAh instead
  if (mah) { const est = mah * (v || 3.7) / 1000; if (!wh || wh < est * 0.5 || wh > est * 1.6) { wh = est; from = 'mah'; } }
  if (!wh) return null;
  return { wh: Math.round(wh * 10) / 10, mah, v: v || 3.7, vGuess: !v, from };
}
export function checkBattery(b) {
  const out = { id: 'powerbank', kind: 'battery', b, src: 'DIK', checkinNote: 'Never. Security will open your bag and take it out.' };
  if (!b) return { ...out, cabin: 'yes', checkin: 'no', head: 'Cabin bag only', cabinNote: 'Yes, if it\'s 100 Wh or less (most are).', why: 'Couldn\'t read the capacity, but most phone power banks (up to 26,800 mAh) are under the 100 Wh limit.' };
  if (b.wh <= 100) return { ...out, cabin: 'yes', checkin: 'no', head: 'Cabin bag only', cabinNote: 'Yes. Keep it with you.', why: `${b.wh} Wh is under the 100 Wh limit, so it can fly, but only in your cabin bag.` };
  if (b.wh <= 160) return { ...out, cabin: 'ask', checkin: 'no', head: 'Ask your airline first', cabinNote: 'Only with the airline\'s OK, at most two.', why: `${b.wh} Wh is over 100 Wh. Power banks from 100 to 160 Wh need the airline's OK, and at most two.` };
  return { ...out, cabin: 'no', checkin: 'no', head: 'Can\'t fly at all', cabinNote: 'No. Over 160 Wh can\'t fly.', why: `${b.wh} Wh is over 160 Wh. That's too big for any passenger flight.` };
}
export const BATTERY_RULES = [
  'Never in the check-in bag. If it\'s in there, security opens your bag and takes it out in front of you.',
  'On Indian flights you can\'t use it to charge anything, and you can\'t charge it from the seat (DGCA, 2026).',
  'Keep it with you or under the seat, not in the overhead bin (DGCA, 2026).',
  'If the airline takes your cabin bag at the gate, take the power bank out first.',
];

// sizes on a pack: 150 ml, 1 L, 500 g, 1 kg -> ml (g counted as ml for pastes and gels)
export function readSize(text) {
  const t = cleanNumbers(text); const out = [];
  for (const m of t.matchAll(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(ml|mL|ML|Ml|m1|l|L|ltr|Ltr|LTR|litre|liter|g|gm|gms|G|GM|grams|kg|Kg|KG)(?![a-zA-Z])/g)) {
    const v = num(m[1].replace(',', '.')), u = m[2].toLowerCase();
    const ml = /^(ml|m1)$/.test(u) ? v : /^(l|ltr|litre|liter)$/.test(u) ? v * 1000 : /^(g|gm|gms|grams)$/.test(u) ? v : v * 1000;
    if (ml > 0 && ml <= 20000) out.push({ ml, label: m[0].replace(/\s+/g, ' ').trim() });
  }
  if (!out.length) return null;
  return out.sort((a, b) => b.ml - a.ml)[0];   // the pack's size is the biggest one printed
}

// which item a label or a search names: the longest matching word wins ("coconut oil" over "coconut", "chilli powder" over "chilli")
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRx = w => new RegExp(`(^|[^a-z])${esc(w)}(?=$|[^a-z])`, 'i');
const RX_ALL = ITEMS.map(i => ({ i, rx: i.w.filter(w => !['mah', 'wh'].includes(w)).map(w => ({ w, rx: wordRx(w) })) }));
const RX_LABEL = ITEMS.map(i => ({ i, rx: i.w.filter(w => !SEARCH_ONLY.has(w)).map(w => ({ w, rx: wordRx(w) })) }));
const norm = text => ' ' + String(text || '').toLowerCase().replace(/[^a-z0-9\- ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
function match(text, table, max) {
  const t = norm(text), hits = [];
  for (const { i, rx } of table) { let best = 0; for (const { w, rx: r } of rx) if (r.test(t)) best = Math.max(best, w.length + (table === RX_LABEL && !WEAK.has(i.id) ? 20 : 0) + (table === RX_LABEL && i.id === 'spices' ? 8 : 0)); if (best) hits.push({ item: i, score: best }); }
  return hits.sort((a, b) => b.score - a.score).slice(0, max).map(h => h.item);
}
export const findItems = (text, max = 8) => match(text, RX_ALL, max);
// on a label: the product's name comes before its ingredients list, so look there first
export function labelItems(text, max = 4) {
  const t = String(text || ''), cut = t.search(/ingredients?\s*[:;.\-]/i);
  const head = cut > 0 ? match(t.slice(0, cut), RX_LABEL, max).filter(i => i.kind !== 'battery') : [];
  return head.length ? head : match(t, RX_LABEL, max).filter(i => i.kind !== 'battery');
}
// search as you type: also matches the start of a word ("ghe" -> ghee, "power" -> power bank)
export function search(q, max = 8) {
  const s = String(q || '').toLowerCase().trim(); if (!s) return [];
  const exact = findItems(s, max); const seen = new Set(exact.map(i => i.id)); const out = [...exact];
  // then by how well the start matches: the item's own name first ("nail" -> Nail cutter before nail polish), then any of its words
  const more = [];
  for (const i of ITEMS) {
    if (seen.has(i.id)) continue; const nm = i.name.toLowerCase();
    const sc = nm.startsWith(s) ? 4 : i.w.some(w => w.startsWith(s)) ? 3 : nm.includes(s) ? 2 : (s.length >= 3 && i.w.some(w => w.includes(s))) ? 1 : 0;
    if (sc) more.push({ i, sc });
  }
  more.sort((x, y) => y.sc - x.sc); out.push(...more.map(m => m.i));
  return out.slice(0, max);
}

// one answer for one thing: an item (maybe with a size from its label), a battery, or "not sure"
export function verdict(item, size) {
  if (item.kind === 'battery') return checkBattery(size?.battery || null);
  const r = { id: item.id, kind: item.kind, name: item.name, cabin: item.cabin, checkin: item.checkin, why: item.why, tip: item.tip, src: item.src, size: size || null,
    cabinNote: null, checkinNote: item.checkinNote || null, checkinTag: item.checkinTag || null };
  if (item.cabinNote) r.cabinNote = item.cabinNote;
  else if (item.kind === 'liquid' && item.cabin === 'limit') {
    if (size?.ml > 100) { r.cabin = 'no'; r.cabinNote = `${size.label} is more than 100 ml. Put it in check-in.`; }
    else if (size?.ml) { r.cabin = 'yes'; r.cabinNote = `${size.label} is within 100 ml. Put it in your clear 1-litre bag.`; }
    else r.cabinNote = 'Only if the bottle is 100 ml or less, in your clear 1-litre bag.';
  }
  if (item.checkinMax && size?.ml > item.checkinMax) { r.checkin = 'no'; r.checkinNote = `${size.label} is over the ${item.checkinMax / 1000} kg / litre limit.`; }
  else if (item.checkinMax && size?.ml && item.checkin === 'limit') { r.checkin = 'yes'; }
  r.head = item.head || headOf(r); return r;
}
export function headOf(r) {
  const c = r.cabin, k = r.checkin;
  if (c === 'no' && k === 'no') return 'Leave it at home';
  if (c === 'yes' && k === 'no') return 'Cabin bag only';
  if (c === 'no' && (k === 'yes' || k === 'limit')) return 'Check-in bag only';
  if (c === 'yes' && (k === 'yes' || k === 'limit')) return 'Both bags are fine';
  if (c === 'limit') return 'Up to 100 ml in the cabin';
  return 'Ask your airline';
}

// a photo of a label -> what it is and the answer
export function classify(text) {
  const t = String(text || '');
  const b = readBattery(t);
  const batteryWords = /power\s*bank|powerbank|li[-\s]?ion|lithium|li[-\s]?polymer|\bmah\b|rated capacity|battery capacity|portable charger/i.test(cleanNumbers(t));
  if (b && (batteryWords || b.mah || (b.from === 'wh' && !b.vGuess && b.wh >= 10))) return { type: 'battery', result: checkBattery(b) };
  const items = labelItems(t), size = readSize(t);
  if (items.length) return { type: 'item', item: items[0], also: items.slice(1, 4), result: verdict(items[0], size) };
  if (batteryWords) {
    const bare = [...cleanNumbers(t).matchAll(/(?<![\d.,])(\d{1,2}[,.]?\d{3}|\d{4,5})(?![\d.,]*\s*(?:v|w|a|mm|g|ml|%))/gi)].map(m => num(m[1].replace(/[.,]/g, ''))).filter(v => v >= 2000 && v <= 50000 && v % 500 === 0);
    if (bare.length) { const mah = Math.max(...bare); return { type: 'battery', result: checkBattery({ wh: Math.round(mah * 3.7 / 100) / 10, mah, v: 3.7, vGuess: true, from: 'mah', bare: true }) }; }
    return { type: 'battery', result: checkBattery(null) };
  }
  if (size && /ml|l\b|ltr|litre/i.test(size.label)) return { type: 'item', item: byId('liquid'), also: [], result: verdict(byId('liquid'), size) };
  return { type: 'unknown', size };
}
