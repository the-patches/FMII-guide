"""Known spelling errors in the original Forbidden Memories card names."""

CORRECTIONS = {
    '186': ('Fiend Refrection #2', 'Fiend Reflection #2'),
    '415': ('Mechanicalchacer', 'Mechanicalchaser'),
    '595': ('Fiend Refrection #1', 'Fiend Reflection #1'),
    '674': ('Beastry Mirror Ritual', 'Beastly Mirror Ritual'),
    '693': ('Contruct of Mask', 'Contract of Mask'),
}


def corrected_spelling(ref, name):
    original, corrected = CORRECTIONS.get(ref, (None, None))
    return corrected if name == original else None
