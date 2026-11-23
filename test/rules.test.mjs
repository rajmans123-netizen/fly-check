// node test/rules.test.mjs : Fly Check's label reading and answers, on made-up labels written the way real ones are (and the way OCR garbles them)
import { readBattery, checkBattery, readSize, classify, search, verdict, byId, findItems, ITEMS } from '../rules.js';
let n = 0, fails = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.log('  FAIL', m); } };
const cls = t => classify(t); const r = t => cls(t).result;

// ---- power banks
let b = readBattery('Model PB-2004\nCapacity: 20000mAh 3.7V 74Wh\nInput: 5V/2A 9V/2A\nOutput: 5V⎓3A');
ok(b && b.wh === 74 && b.mah === 20000 && b.v === 3.7, 'stated Wh: ' + JSON.stringify(b));
b = readBattery('Battery capacity 10000mAh/3.85V\nRated capacity 6000mAh (5V 2.4A)'); ok(b && b.wh === 38.5 && b.mah === 10000, 'mAh x cell volts, rated capacity ignored: ' + JSON.stringify(b));
b = readBattery('POWER BANK 20,000 mAh  Li-polymer'); ok(b && b.wh === 74 && b.vGuess, 'no voltage -> 3.7 V: ' + JSON.stringify(b));
b = readBattery('Capacity: 2OOOOmAh 3.7V'); ok(b && b.mah === 20000, 'O read for 0: ' + JSON.stringify(b));
b = readBattery('30000mAh 3.7V 111Wh'); ok(checkBattery(b).cabin === 'ask', '30,000 mAh = 111 Wh needs approval');
b = readBattery('Capacity 50000mAh 3.7V'); ok(checkBattery(b).cabin === 'no' && checkBattery(b).head === "Can't fly at all", '50,000 mAh = 185 Wh can\'t fly');
b = readBattery('26800mAh 3.7V'); ok(b.wh === 99.2 && checkBattery(b).cabin === 'yes', '26,800 mAh just under 100 Wh: ' + b.wh);
b = readBattery('Li-ion 3.7V 10000 mAh 37 Wh'); ok(b.wh === 37, 'spaced units');
ok(readBattery('Output 5V 2A') === null, 'no capacity -> null');
let c = cls('MI Power Bank 3i\n20000mAh\nLi-Polymer\n3.7V 74Wh'); ok(c.type === 'battery' && c.result.checkin === 'no' && c.result.cabin === 'yes', 'scan a power bank label');
c = cls('POWER BANK\nMade in India'); ok(c.type === 'battery' && c.result.checkin === 'no', 'power bank, capacity unreadable: still never check-in');

// ---- liquids with sizes
ok(readSize('Eau de Parfum 100 ml / 3.4 fl oz').ml === 100, '100 ml');
ok(readSize('Net Qty: 1 L').ml === 1000, '1 L');
ok(readSize('Net Wt. 500 g').ml === 500, '500 g');
ok(readSize('NET QUANTITY 150ml').ml === 150, '150ml no space');
let v = r('EAU DE PARFUM\nFor men\n100 ml / 3.4 fl.oz'); ok(v.cabin === 'yes' && /100 ml/.test(v.cabinNote), 'perfume 100 ml fits the cabin: ' + JSON.stringify(v));
v = r('Deodorant Body Spray\n150 ml\nIngredients: Butane, Isobutane, Propane, Alcohol, Parfum'); ok(v.id === 'perfume' && v.cabin === 'no' && v.checkin === 'yes', 'deo 150 ml -> check-in (not "gas" from butane): ' + JSON.stringify(v));
v = r('PURE COW GHEE\nNet Qty 1 L'); ok(v.id === 'ghee' && v.cabin === 'no' && v.checkin === 'yes', 'ghee 1 L -> check-in: ' + JSON.stringify(v));
v = r('Pure Ghee 10 L tin'); ok(v.id === 'ghee' && v.checkin === 'no', 'ghee over 5 L');
v = r('MANGO PICKLE\nIngredients: Mango, Mustard oil, Salt, Red chilli powder, Spices\nNet Wt 400 g'); ok(v.id === 'pickle' && v.cabin === 'no' && v.checkin === 'yes', 'pickle, not spices or oil: ' + v.id);
v = r('Ingredients: Mango, Mustard oil, Salt, Red chilli powder\nMango Pickle 200 g'); ok(v.id === 'pickle', 'pickle named after its ingredients: ' + v.id);
v = r('Shampoo\nAnti dandruff\n340 ml\nIngredients: Aqua, Sodium laureth sulfate, Fragrance'); ok(v.id === 'toiletries' && v.cabin === 'no', 'shampoo 340 ml: ' + v.id);
v = r('Coconut Oil\n100% pure\n500 ml'); ok(v.id === 'oil' && v.cabin === 'no' && v.checkin === 'yes', 'coconut oil, not coconut: ' + v.id);
v = r('Haldiram\'s Rasgulla\nNet Wt. 1 kg'); ok(v.id === 'syrupsweets' && v.cabin === 'no', 'rasgulla tin');
v = r('Some lotion 50 ml'); ok(v.cabin === 'yes', 'lotion 50 ml ok');

// ---- solid food
v = r('RED CHILLI POWDER\nNet Wt. 100 g'); ok(v.id === 'spices' && v.cabin === 'no' && v.checkin === 'yes', 'chilli powder: check-in only');
v = r('GARAM MASALA\nIngredients: Coriander, Cumin, Black pepper, Salt'); ok(v.id === 'spices', 'garam masala');
v = r('Tata Salt\nIodised salt\n1 kg'); ok(v.id === 'powders' && v.cabin === 'yes' && v.checkin === 'yes', 'salt: both bags');
v = r('Sugar 1 kg'); ok(v.id === 'powders' && v.cabin === 'yes', 'sugar both');
v = r('Whole Wheat Atta 5 kg'); ok(v.id === 'powders', 'atta');
v = r('100% WHEY PROTEIN\nNutrition: Protein 24 g, Sugar 2 g'); ok(v.id === 'protein' && v.cabin === 'yes', 'whey: ' + v.id);
v = r('Aloo Bhujia\nIngredients: Besan, Potato, Edible oil, Salt, Chilli\nNutrition: Protein 12 g, Sugar 1 g'); ok(v.id === 'dryfood' && v.cabin === 'yes', 'namkeen, not chilli/salt/protein: ' + v.id);
v = r('Cream biscuits\nIngredients: Wheat flour, Sugar, Edible oil, Desiccated coconut'); ok(v.id === 'dryfood', 'biscuits with desiccated coconut are not copra: ' + v.id);
v = r('Dry coconut (Copra) 250 g'); ok(v.id === 'copra' && v.cabin === 'no' && v.checkin === 'no', 'copra banned in both');
v = r('Camphor tablets'); ok(v.cabin === 'no' && v.checkin === 'no', 'camphor banned');
v = r('Safety Matches\nHomeline'); ok(v.id === 'matches' && v.checkin === 'no', 'matchbox');
v = r('Whisky 750 ml\n42.8% v/v alcohol'); ok(v.id === 'alcohol' && v.cabin === 'no' && v.checkin === 'yes', 'whisky 750 ml: check-in');
v = r('Body lotion\nCustomer care phone: 1800 123 456\n200 ml'); ok(v.id === 'toiletries', 'a phone number on a label is not a phone: ' + v.id);
v = r('Hair trimmer\nStainless steel blades\nLi-ion battery 3.7V 600mAh'); ok(cls('Hair trimmer\nStainless steel blades\nLi-ion battery 3.7V 600mAh').type === 'battery' || v.id !== 'blades', 'trimmer is not loose blades');

// ---- search
ok(search('power')[0].id === 'powerbank', 'search "power"');
ok(search('ghee')[0].id === 'ghee', 'search ghee');
ok(search('ghe')[0].id === 'ghee', 'search "ghe" prefix');
ok(search('achar')[0].id === 'pickle', 'search achar');
ok(search('mirchi')[0].id === 'spices', 'search mirchi');
ok(search('nail')[0].id === 'nailcutter', 'search nail');
ok(search('coconut').map(i => i.id).includes('copra') && search('coconut').map(i => i.id).includes('coconut'), 'search coconut finds dry and fresh');
ok(search('bat')[0].id === 'bat', 'search bat');
ok(search('phone')[0].id === 'devices', 'search phone');
ok(search('zzzz').length === 0, 'no results');
ok(verdict(byId('nailcutter')).cabin === 'ask', 'nail cutter = ask');
ok(verdict(byId('perfume')).cabin === 'limit' && verdict(byId('perfume')).head === 'Up to 100 ml in the cabin', 'perfume without size');
ok(classify('Lorem ipsum dolor').type === 'unknown', 'unknown text');
for (const i of ITEMS) ok(i.kind === 'battery' || (i.cabin && i.checkin && i.why), 'every item has both answers and a why: ' + i.id);
console.log(fails ? `${fails} of ${n} checks FAILED` : `all ${n} checks passed`); process.exit(fails ? 1 : 0);
