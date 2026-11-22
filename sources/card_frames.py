"""Resolve the Recomp's native card frames for the guide and the audit."""

MOD_FRAMES = {
    'monster': 'Dourado', 'magic': 'Verde', 'trap': 'Rosa', 'ritual': 'Azul',
    'purple': 'Roxo', 'orange': 'Laranja', 'gold': 'Dourado', 'green': 'Verde',
    'pink': 'Rosa', 'blue': 'Azul',
}
TYPE_FRAMES = {'magic': 'Verde', 'spell': 'Verde', 'equip': 'Verde',
               'trap': 'Rosa', 'ritual': 'Azul'}


def native_frame(declared, effect, kind):
    if isinstance(declared, int) and 0 <= declared <= 6:
        declared = ('Monster', 'Magic', 'Trap', 'Ritual', 'Purple', 'Orange', 'Type')[declared]
    field = str(declared).casefold() if declared is not None else None
    if field in MOD_FRAMES:
        return MOD_FRAMES[field]
    if field not in (None, 'type'):
        raise ValueError(f'frame desconhecido: {declared!r}')
    kind = kind.casefold()
    if field is None and effect and kind not in TYPE_FRAMES:
        return 'Laranja'
    return TYPE_FRAMES.get(kind, 'Dourado')


def card_frame_entries(manifest):
    state = {}
    for entry in manifest['cards']:
        base = str(entry['replace'] if 'replace' in entry else entry['copy'])
        declaration, effect = state.get(base, (None, False))
        frame = entry.get('frame', declaration), bool(entry.get('monster_effects', effect))
        refs = [base] if 'replace' in entry else [
            f'{manifest["id"]}:{entry["id"]}:{copy}'
            for copy in range(1, entry.get('copies', 1) + 1)
        ]
        for ref in refs:
            state[ref] = frame
            yield ref, base, entry, frame
