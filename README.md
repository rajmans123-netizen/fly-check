# Fly Check · can I carry this on the flight?

Scan your power bank, a bottle or any pack (or search an item) and see if it can go in your **cabin bag**, your **check-in bag**, or neither, on flights in India.

**Try it:** https://rajmans123-netizen.github.io/fly-check/

- **Power banks:** reads the mAh and voltage (or Wh) off the label and works out the watt-hours: up to 100 Wh in the cabin, 100–160 Wh only with the airline's OK, over 160 Wh not at all. Never in check-in. Plus DGCA's 2026 rules: no charging anything from a power bank on board, and not in the overhead bin.
- **Liquids:** reads the ml on the bottle: 100 ml or less in the cabin (in one clear 1-litre bag), bigger in check-in.
- **Indian items:** ghee, achar, masala and chilli powder, salt and sugar, dry coconut, camphor, matches, rasgulla, protein powder and 40 more, from BCAS's list of banned items.
- **Says when it depends:** nail cutters, fresh coconut and liquid medicines get "ask your airline", never a guess.
- **Private:** the photo is read on your phone (tesseract.js). Only the reader's code and English model are downloaded, once.

**Sources:** BCAS's indicative list of prohibited items (as published by Indian airports), DGCA's 2026 advisory on power banks, IATA's lithium battery limits. Checked 23 Nov 2026. Airlines can be stricter, and security has the final word.

`node test/rules.test.mjs` runs 95 checks on made-up labels, including OCR mistakes.

Built with Claude by [Raj Tries](https://instagram.com/raj_triess). MIT licensed.
