"""Build the offline FMII-Recomp guide from the installed package layout."""

import argparse
import json
import hashlib
import re
import shutil
import struct
import sys
from html import escape
from pathlib import Path

from card_frames import card_frame_entries, native_frame
from card_spellings import corrected_spelling


ROOT = Path(__file__).resolve().parent.parent
MOD = ROOT / 'mod'
GUIDE = ROOT / 'guia'
WORK = ROOT.parent / 'FMII-importacao'
EDITOR = WORK / 'Yu-Gi-Oh-Forbidden-Memories-Recompiled-0.3.1-preview.2/tools/pc'
DISC = ROOT.drive + '/JOGOS ISOS/Yu-Gi-Oh! - Forbidden Memories.bin'
TOTAL = 2048
ORIGINAL_ART = 'assets/cartas-originais'
GOD_TRAP_NOTE = (
    'Imune a armadilhas de destruição, como Mirror Force. Pyramid of Light é a exceção '
    'e pode destruir esta carta quando ela ataca. Armadilhas que não destroem, como '
    'Negate Attack e Magic Cylinder, ainda podem ativar.'
)
EFFECT_NOTES = {
    'fmii-recomp:fmii-670:1': 'Enquanto Jinzo estiver com a face para cima no campo, '
                              'armadilhas de destruição de ambos os lados ficam bloqueadas.',
    'fmii-recomp:fmii-696:1': 'Quem invocar Horakhty com a face para cima vence o duelo imediatamente.',
    'fmii-recomp:fmii-698:1': GOD_TRAP_NOTE,
    'fmii-recomp:fmii-699:1': GOD_TRAP_NOTE,
    'fmii-recomp:fmii-700:1': GOD_TRAP_NOTE,
}


def original_art_path(card_id):
    return f'{ORIGINAL_ART}/{card_id:03}.png'


def update_original_art(archive, cards, extractor, check):
    original_ids = [card['id'] for card in cards if card['art'] == original_art_path(card['id'])]
    if check:
        return all((GUIDE / original_art_path(card_id)).is_file() for card_id in original_ids)

    (GUIDE / ORIGINAL_ART).mkdir(parents=True, exist_ok=True)
    for card_id in original_ids:
        path = GUIDE / original_art_path(card_id)
        offset = (722 + (card_id - 1) * 7) * TOTAL
        palette = extractor.read_palette(archive, offset + 0x2640, 256)
        extractor.write_png(path, *extractor.decode(archive, offset, 51, 96, 8, palette))
    return True


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def publish_assets(cards, duelists, published_version, check):
    """Keep every published resource inside guia; never delete unowned files."""
    exported = {}

    def put(source, relative):
        if relative in exported:
            return relative
        source = Path(source)
        destination = GUIDE / relative
        if not source.is_file() or not destination.resolve().is_relative_to(GUIDE.resolve()):
            raise ValueError(f'Invalid guide asset: {source} -> {relative}')
        with source.open('rb') as stream:
            checksum = hashlib.file_digest(stream, 'sha256').hexdigest()
        same = destination.is_file() and destination.stat().st_size == source.stat().st_size
        if same:
            with destination.open('rb') as stream:
                same = hashlib.file_digest(stream, 'sha256').hexdigest() == checksum
        if not same:
            if check:
                raise ValueError(f'Missing or stale published asset: {relative}')
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
        exported[relative] = {'sha256': checksum, 'bytes': source.stat().st_size}
        return relative

    for card in cards:
        for field in ('art', 'thumbnail'):
            value = card[field]
            if value and value.startswith('../mod/'):
                relative = value[len('../mod/'):]
                card[field] = put(MOD / relative, f'assets/mod/{relative}')
    for duelist in duelists:
        if duelist['portrait']:
            relative = duelist['portrait']
            duelist['portrait'] = put(MOD / relative, f'assets/mod/{relative}')
    put(ROOT / 'scripts/guide.css', 'assets/guide.css')
    put(ROOT / 'scripts/guide.js', 'assets/guide.js')
    put(ROOT / 'artes/campaign-opening-logo-HD.png', 'assets/ui/logo.png')
    put(MOD / 'textures/scenes/campaign-opening/wall.png', 'assets/ui/wall.png')
    put(ROOT / 'ESTADO-ATUAL.md', 'docs/ESTADO-ATUAL.md')
    put(ROOT / 'scripts/guide-README.md', 'README.md')
    if published_version:
        put(ROOT / f'releases/{published_version}/LEIA-ME.md', f'docs/LEIA-ME-{published_version}.md')

    outputs = {'.nojekyll': '',
               'assets-manifest.json': json.dumps(exported, ensure_ascii=False, indent=2) + '\n'}
    for relative, content in outputs.items():
        destination = GUIDE / relative
        if check:
            if not destination.is_file() or destination.read_text(encoding='utf-8') != content:
                raise ValueError(f'Missing or stale published file: {relative}')
        else:
            destination.write_text(content, encoding='utf-8')


def changelog_html():
    blocks = []
    in_list = False
    for line in (ROOT / 'CHANGELOG.md').read_text(encoding='utf-8').splitlines():
        line = line.strip()
        is_item = line.startswith('- ')
        if in_list and not is_item:
            blocks.append('</ul>')
            in_list = False
        if is_item:
            if not in_list:
                blocks.append('<ul>')
                in_list = True
            blocks.append(f'<li>{escape(line[2:])}</li>')
        elif line:
            heading = re.fullmatch(r'(#{1,3}) (.+)', line)
            if heading:
                level = len(heading[1]) + 1
                blocks.append(f'<h{level}>{escape(heading[2])}</h{level}>')
            else:
                blocks.append(f'<p>{escape(line)}</p>')
    if in_list:
        blocks.append('</ul>')
    return '\n'.join(blocks)


def display(text):
    text = re.sub(r'\{(?:end|cont|sp|f8\b[^}]*)\}', '', text, flags=re.I)
    return text.strip()


def scale(weights, target):
    total = sum(weights.values())
    if not total:
        return {}
    parts = {card: divmod(weight * target, total) for card, weight in weights.items()}
    remaining = target - sum(share for share, _ in parts.values())
    priority = sorted(parts, key=lambda card: (-parts[card][1], card))
    result = {card: share for card, (share, _) in parts.items()}
    for card in priority[:remaining]:
        result[card] += 1
    return result


def drop_pool(retail, edits, replace=False):
    if edits is None:
        result = dict(retail)
    else:
        explicit = {card: weight for card, weight in edits.items() if weight}
        unlisted = {} if replace else {card: weight for card, weight in retail.items() if card not in edits}
        if sum(explicit.values()) >= TOTAL or not unlisted:
            result = scale(explicit, TOTAL) or dict(retail)
        else:
            result = explicit | scale(unlisted, TOTAL - sum(explicit.values()))
    # The resolver walks from the lowest runtime ID and rolls 1 through 2048.
    remaining = TOTAL
    draw = []
    for card, weight in sorted(result.items()):
        reachable = min(weight, remaining)
        if reachable:
            draw.append([card, reachable])
            remaining -= reachable
    return draw, remaining


def card_catalog(m, base, definitions):
    entries = {c['replace']: c for c in m['cards'] if isinstance(c.get('replace'), int)}
    frames = {ref: frame for ref, _, _, frame in card_frame_entries(m)}
    text_colors = {c['card']: c.get('name') for c in m.get('card_text_colors', {}).get('cards', [])}
    refs = {str(i): i for i in base.cards}
    cards = []

    def named(value, names):
        return names[value] if isinstance(value, int) and 0 <= value < len(names) else value

    def collect(id, ref, card, entry):
        value = lambda field, default=None: entry.get(field, getattr(card, field, default))
        type_id = value('type')
        kind = named(type_id, definitions.TYPE_NAMES)
        name = display(value('name'))
        declaration, effect = frames.get(ref, (None, False))
        monster = (isinstance(type_id, int) and type_id < 20) or type_id in definitions.TYPE_NAMES[:20]
        stars = value('stars', [getattr(card, 'star1', 0), getattr(card, 'star2', 0)])
        password = {'password': entry.get('password', base.passwords.get(id)),
                    'starchips': entry.get('starchips', base.starchips.get(id))}
        password.update(m.get('passwords', {}).get(ref, {}))
        art = entry.get('art')
        thumbnail = entry.get('thumbnail')
        guide_art = f'../mod/{art}' if art else (original_art_path(id) if ref.isdecimal() else None)
        cards.append(dict(id=id, ref=ref, name=name, description=display(value('description', '')),
                          effectNote=EFFECT_NOTES.get(ref),
                          type=kind, attribute=named(value('attribute'), definitions.ATTRIBUTE_NAMES),
                          attack=value('attack') if monster else None, defense=value('defense') if monster else None,
                          level=value('level') if monster else None,
                          stars=[named(star, definitions.STAR_NAMES) for star in stars if star],
                          art=guide_art, thumbnail=f'../mod/{thumbnail}' if thumbnail else guide_art,
                          frame=entry.get('frame'), frameColor=native_frame(declaration, effect, kind),
                          correctedSpelling=corrected_spelling(ref, name),
                          nameColor=text_colors.get(int(ref) if ref.isdecimal() else ref),
                          password=password.get('password') or None,
                          starchips=password.get('starchips') if password.get('password') else None,
                          expansion=not ref.isdecimal()))

    for id, card in sorted(base.cards.items()):
        collect(id, str(id), card, entries.get(id, {}))
    for entry in m['cards']:
        if 'id' not in entry:
            continue
        copies = entry.get('copies', 1)
        for copy in range(1, copies + 1):
            ref = f'{m["id"]}:{entry["id"]}:{copy}'
            id = len(cards) + 1
            refs[ref] = id
            collect(id, ref, None, entry)
    return cards, refs


def tables(m, base, refs):
    def resolve(ref):
        return refs[str(ref)]

    fusions = {tuple(sorted(pair)): [*sorted(pair), result, 'Original'] for pair, result in base.fusions.items()}
    overrides = {}
    for order, rule in enumerate(m['fusions']):
        if 'remove' in rule or rule.get('result') is None:
            raise ValueError('Update the guide merger before handling fusion removal rules')
        pair = tuple(sorted(map(resolve, rule['with'])))
        result = resolve(rule['result'])
        overrides[pair] = (order, result)
        fusions[pair] = [*pair, result, 'FMII']
    add_inherited_fusions(m, base, refs, fusions, overrides)

    mapping = {row['slot_fmii']: resolve(row['reference'])
               for row in read(ROOT / 'metadados/mapa-cartas-fmii.json')}
    ritual_rules = {card: [[card, *recipe, 'Original']] for card, recipe in base.rituals.items()
                    if base.cards[card].type == 22}
    for rule in m['rituals']:
        card = resolve(rule['card'])
        ritual_rules[card] = [[card, *map(resolve, rule['tributes']), resolve(rule['result']), 'FMII']]
    effects = (ROOT / 'source/effects/fmii-effect-cards.h').read_text(encoding='utf-8')
    poly = effects.split('fmii_polymerization[][4] = {', 1)[1].split('};', 1)[0]
    poly_id = mapping[695]
    ritual_rules[poly_id] = [[poly_id, *(mapping[int(slot)] for slot in row), 'FMII']
                             for row in re.findall(r'{\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\s*}', poly)]
    start = [{'draws': pool['draws'], 'cards': [[resolve(ref), weight] for ref, weight in pool['cards'].items()]}
             for pool in m['starter_pools']]
    if sum(p['draws'] for p in start) != 40:
        raise ValueError('The FMII starter must deal forty cards')
    return list(fusions.values()), [row for rules in ritual_rules.values() for row in rules], start


def add_inherited_fusions(m, retail, refs, fusions, overrides):
    # Match Tables_Fusion, then the disc fallback in CardRules_Fusion.
    # Current card entries use the top-level fusion table exclusively.
    if any('fusions' in card for card in m['cards']):
        raise ValueError('Update the guide merger before handling per-card fusion rules')
    base_id = {id: id for id in retail.cards}
    types = {id: card.type for id, card in retail.cards.items()}
    for card in m['cards']:
        if 'id' in card:
            for copy in range(1, card.get('copies', 1) + 1):
                ref = f'{m["id"]}:{card["id"]}:{copy}'
                id = refs[ref]
                base_id[id] = refs[str(card['copy'])]
                types[id] = card.get('type', types[base_id[id]])
        elif 'type' in card:
            types[refs[str(card['replace'])]] = card['type']
    kind = lambda id: 0 if types[id] < 20 else types[id]
    unchanged = {id: kind(id) == kind(parent) for id, parent in base_id.items()}
    pair = lambda a, b: (a, b) if a <= b else (b, a)
    first_expansion = len(retail.cards) + 1
    for a, parent_a in base_id.items():
        for b in range(max(a, first_expansion), len(refs) + 1):
            if (a, b) in overrides:
                continue
            parent_b = base_id[b]
            key = pair(parent_a, parent_b)
            one = overrides.get(pair(a, parent_b), (-1, 0))
            other = overrides.get(pair(parent_a, b), (-1, 0))
            inherited = max(one, other) if max(one, other)[0] >= 0 else overrides.get(key)
            if inherited is not None:
                result = inherited[1]
            else:
                result = retail.fusions.get(key, 0) if unchanged[a] and unchanged[b] else 0
                if result and not unchanged[result]:
                    result = 0
            if result:
                fusions[a, b] = [a, b, result, 'Herdada']


def retail_starter(archive, offset):
    pools = []
    for row in range(7):
        draws, *weights = struct.unpack_from('<723H', archive, offset + row * 0x5B8)
        if sum(weights[:720]) != TOTAL or any(weights[720:]):
            raise ValueError(f'Unexpected original starter weights in row {row + 1}')
        pools.append({'draws': draws, 'cards': [[i, weight] for i, weight in enumerate(weights[:720], 1) if weight]})
    return pools


def conflicting_fusions(disc, definitions, base, refs, fusions):
    source = ROOT / 'originais/dados-fmii'
    retail_pair = {tuple(sorted(pair)): result for pair, result in base.fusions.items()}
    live = {(a, b): result for a, b, result, _ in fusions}
    fmii = definitions.load_game(disc.load_pair(source / 'FMII.136', source / 'FMOD/FMODGTAV.1'))
    mapping = {row['slot_fmii']: refs[str(row['reference'])]
               for row in read(ROOT / 'metadados/mapa-cartas-fmii.json')}
    rows = []
    for (first, second), result in fmii.fusions.items():
        pair = tuple(sorted((mapping[first], mapping[second])))
        original = retail_pair.get(pair)
        if original is not None and mapping[result] != original:
            rows.append([*pair, original, mapping[result], live.get(pair)])
    return sorted(rows)


def opponents(base, refs):
    duelists = []
    ranks = [('pow', 'S/A-Pow'), ('bcd', 'B/C/D-Pow/Tec'), ('tec', 'S/A-Tec')]
    for file in sorted((MOD / 'duelists').glob('*.json')):
        id = int(file.name[:2])
        entry = read(file)
        deck = read(MOD / 'decks' / file.name)
        edits = read(MOD / 'drops' / file.name)
        if deck.pop('replace', None) is not True or sum(deck.values()) != TOTAL:
            raise ValueError(f'Update the guide before handling this deck format: {file.name}')
        # fmii-drops.c routes the base drops by character across the tournament swap.
        swaps = {(15, 'Seto Kaiba'): 17, (17, 'Maximillion Pegasus'): 15}
        retail_id = swaps.get((id, entry['name']), id)
        drops = []
        for key, label in ranks:
            selected = edits.get(key)
            replace = selected.get('replace', False) if selected is not None else False
            if not isinstance(replace, bool):
                raise ValueError(f'Invalid drop replacement flag: {file.name}')
            card_weights = None if selected is None else {
                refs[ref]: weight for ref, weight in selected.items() if ref != 'replace'
            }
            if replace and not any(card_weights.values()):
                raise ValueError(f'Empty replacement drop table: {file.name}, {key}')
            weights, empty = drop_pool(base.pools[retail_id][key],
                                       card_weights, replace=replace)
            drops.append({'rank': label, 'cards': weights, 'empty': empty})
        duelists.append({'id': id, 'name': entry['name'], 'portrait': entry.get('portrait', f'textures/portraits/free-duel-{id:02}.png'),
                         'deck': [[refs[ref], w] for ref, w in deck.items()], 'drops': drops})
    return duelists


def campaign():
    script = (MOD / 'text/campaign.txt').read_text(encoding='utf-8')
    pattern = r'^\[([0-9A-Fa-f]{4})\][^\n]*\n(.*?)(?=^\[|\Z)'
    routes = []
    for dialog, block in re.findall(pattern, script, flags=re.M | re.S):
        for duel, victory, defeat in re.findall(r'\{f8 0D ([\dA-F]{2}) ([\dA-F]{2}) ([\dA-F]{2}) [^}]+\}', block, flags=re.I):
            routes.append([dialog, int(duel, 16), victory, defeat])
    source = (ROOT / 'source/bust-cache.c').read_text(encoding='utf-8')
    field = lambda key: int(re.search(r'\b' + key + r' = (\d+)', source)[1])
    unlock = int(re.search(r'\.result\.wins < (\d+)', source)[1])
    return {'duels': routes, 'palace': [unlock, field('PALACE_ROUNDS'), field('PALACE_REWARD')]}


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--editor', type=Path, default=EDITOR, help='Recomp source tools/pc directory')
    cli.add_argument('--disc', type=Path, default=DISC, help='Retail US BIN, read only')
    cli.add_argument('--check', action='store_true', help='Fail if the existing guide is stale')
    args = cli.parse_args()
    sys.path.insert(0, str(args.editor))
    import extract_images
    from fm_editor import disc, gamedata

    m = read(MOD / 'mod.json')
    for file in (ROOT / 'source/manifest').glob('*.json'):
        expected = read(file)
        actual = {key: m.get(key) for key in expected} if file.stem == 'base' else m.get(file.stem)
        if actual != expected:
            cli.error('Build mod/mod.json before generating the guide')
    retail = disc.load(args.disc)
    base = gamedata.load_game(retail)
    cards, refs = card_catalog(m, base, gamedata)
    fmii_refs = {str(row['reference']) for row in read(ROOT / 'metadados/mapa-cartas-fmii.json')}
    equip_compatibility = []
    for rule in m['equips']:
        if str(rule['card']) not in fmii_refs:
            continue
        if not rule.get('replace'):
            cli.error('FMII equip guide requires explicit replacement target lists')
        removed = {str(ref) for ref in rule.get('remove', [])}
        equip_compatibility.append({'card': refs[str(rule['card'])],
                                    'targets': sorted({refs[str(ref)] for ref in rule.get('add', [])
                                                       if str(ref) not in removed})})
    fusions, rituals, starter = tables(m, base, refs)
    published = [folder.name for folder in (ROOT / 'releases').iterdir()
                 if re.fullmatch(r'\d+\.\d+\.\d+', folder.name)
                 and (folder / f'FMII-Recomp-{folder.name}.zip').is_file()
                 and (folder / 'LEIA-ME.md').is_file()]
    published_version = max(published, key=lambda version: tuple(map(int, version.split('.'))), default=None)
    data = dict(version=m['version'], cards=cards, equips=equip_compatibility, fusions=fusions, rituals=rituals, starter=starter,
                development='-' in m['version'], publishedVersion=published_version, changelog=changelog_html(),
                originalStarter=retail_starter(retail.wa, gamedata.STARTER_BASE),
                conflicts=conflicting_fusions(disc, gamedata, base, refs, fusions),
                duelists=opponents(base, refs), campaign=campaign())
    publish_assets(cards, data['duelists'], published_version, args.check)
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', r'\u003c')
    template = (ROOT / 'scripts/guide-template.html').read_text(encoding='utf-8')
    html = template.replace('__GUIDE_DATA__', payload)
    output = GUIDE / 'index.html'
    if not update_original_art(retail.wa, cards, extract_images, args.check):
        cli.error('Original card art is missing. Run scripts/build-guide.py again.')
    for card in cards:
        for asset in (card['art'], card['thumbnail']):
            if asset and not (GUIDE / asset).is_file():
                cli.error(f'Missing guide image for {card["name"]}: {asset}')
    if args.check:
        if not output.is_file() or output.read_text(encoding='utf-8') != html:
            cli.error('The guide is stale. Run scripts/build-guide.py again.')
    else:
        GUIDE.mkdir(exist_ok=True)
        output.write_text(html, encoding='utf-8')
    print(f'{output}: {len(cards)} cards, {len(data["duelists"])} duelists, {len(fusions)} fusions, {len(rituals)} ritual recipes')


if __name__ == '__main__':
    main()
