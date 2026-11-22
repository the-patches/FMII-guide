# Changelog

## 0.3.0 — November 22, 2026

- Restored Horakhty's original description. Its ATK and DEF are now 0, and its instant-win effect still applies.
- Updated Jinzo's description to say that neither player can activate destructive traps while it is face up.
- Updated the frames of 555 cards that had blue, purple, gold, or orange frames. The existing green and pink frames were preserved.
- Standardized 75 expansion card names.
- All 518 expansion cards now have HD large artwork and thumbnails. Marine's Revenge, VWXYZ-Force, and Horakhty use upscaled and sharpened versions of the native textures. Polymerization and Chimaera, the Master of Beasts still need framing adjustments.

## 0.2.0 — November 21, 2026

### Card Effects

- Horakhty immediately wins the duel for whoever summons it face up.

### Drops

- Replaced all 117 drop tables for the 39 duelists using the Compilation - FM II spreadsheet. Added original disc drops for original cards absent from FMII through name matches and user-defined counterparts.
- Added original disc drops for 491 cards absent from FMII across the 39 matched duelists, including Kaiba and Seto Kaiba, and Pegasus and Maximillion Pegasus.
- Added the matches Thief Bakura/Heishin, Thief King Bakura/Heishin 2nd, Guardian Dox/Labyrinth Mage, Yami Marik/Seto 2nd, Yami Marik 2nd/Seto 3rd, Diabound/DarkNite, Zorc Necrophades/Nitemare, Ryo Bakura/Yami Bakura, Joey Wheeler/Jono 2nd, Ishizu Ishtar/Isis, Priest Seto/Seto, and Pharaoh Atem/Duel Master K.
- Completed the remaining matches in order from Guardian Para/Mage Soldier through Aknadin/Guardian Sebek, Odion Ishtar/Guardian Neku, Karim/Jono, Mahad/Villager 1, Karim 2nd/Shadi, Mako Tsunami/Villager 3, and Marik Ishtar/Villager 2.
- The distribution includes 1,239 distinct cards across 11,006 card, duelist, and rank entries.
- Rescaled weights to total 2,048 per table, with a positive weight for every listed card. The 200 entries without a reference weight have a final weight of 1.
- Added weight-1 rewards for 19 previously unobtainable cards according to deck lists. Seto Kaiba drops Obelisk the Tormentor at S/A-Pow with weight 1. Horakhty remains unobtainable as a drop.
- Zorc Necrophades now drops 30 cards that had no duel reward and did not appear in decks. Each has weight 1 at the rank for its type and stats.

### Compatibility and Graphics

- Removed card frames and palettes imported from the FMII disc. Blue uses Recomp's native Ritual palette. Cards marked for purple use that frame, including B. Skull Dragon. The remaining cards that were orange in FMII use Recomp orange. Blue-Eyes White Dragon uses the default frame.
- Added 246 optional HD illustrations for expansion cards. HD Textures enables their large artwork and 160 × 128 thumbnails.
- Added native-resolution versions of the mod's 84 approved scenes. With HD off, these scenes retain the game's layers and effects.
- Added native-resolution versions of the Forbidden Memories 2 logo and opening hieroglyph panel for use with HD off.
- Restored all 65 native FMII character sprite banks, including the intermediate animation frames, when HD is off.
- Adjusted the HD mouth crops for Mahad and Karim to limit changes to the rest of the face. Other character sprites keep their previous artwork.
- Included compiled Android arm64 code in the PC package. Android still awaits on-device testing.
- Restored the optional HD Textures setting and made it off by default. Native FMII images are used by default. Restart the game after enabling HD.
- Removed mandatory PNG loading for duelist portraits and character sprites. The mod uses its native images with optional HD replacements.
- Restricted the character sprite cache fix to HD Textures mode.

### Equipment

- Extended 42 FMII Equip cards to original monsters absent from FMII, adding 3,253 compatible pairs.
- Compatibility considers type, attribute, level, ATK, ritual, or card family, preserving existing FMII targets, exceptions, and bonuses.
- Riryoku and Megamorph now accept all 1,068 eligible monsters. Gearfried the Iron Knight remains excluded.

### Passwords and Shop

- Applied passwords and prices from the Compilation - FM II spreadsheet to all 722 FMII cards, including 175 shared cards that previously used the original values.
- Corrected four prices, respected the eight cards flagged as unavailable for password purchase, and preserved leading zeroes.

### Duelists

- Pharaoh Atem's deck now includes The Winged Dragon of Ra at weight 8 and The Creator of Light at weight 50.
- Corrected the capitalization of Seto Kaiba's surname.

## 0.1.0 — Initial Release

- First public version with campaign, scenes, portraits, character sprites, and an HD opening.
- Added 518 expansion cards and preserved the IDs of the 722 original cards.
- Adapted decks, drops, fusions, rituals, and effects from FMII.
- Added the campaign's 20-duel Palace Challenge.
- Detailed notes are in releases/0.1.0/LEIA-ME.md. The official package SHA-256 is ea2f2baec72fdf7c0d387d8a56abe27a979a4aca95e05c2ff95834b09a2ea3df.
