#!/usr/bin/env python3
"""Generate the Simplified -> Traditional Chinese conversion snippet embedded
into the dsh-client-locale patch (patches/@deepseek-ai+dsh-client-locale+*.patch).

Scans every @deepseek-ai client bundle for string literals containing CJK
characters, then emits two lookup tables:

- S2T_CHARS: per-character mapping for every CJK char actually used by the UI
- S2T_PHRASES: whole-string overrides where zhconv's word-level conversion
  differs from the naive per-character conversion (e.g. 恢复 -> 恢復, not 恢複)

Usage: .venv-i18n/bin/python scripts/generate-zh-hant-table.py <output.js>
Requires: pip install zhconv (into an isolated venv).
"""

import json
import re
import sys
from pathlib import Path

import zhconv

ROOT = Path(__file__).resolve().parent.parent
PACKAGES = ROOT / "node_modules" / "@deepseek-ai"

STRING_RE = re.compile(r'"((?:[^"\\\n]|\\.)*)"|\'((?:[^\'\\\n]|\\.)*)\'')
CJK_RE = re.compile(r"[一-鿿]")


def unescape(raw: str) -> str:
    # Bundled dict values only use simple escapes; keep unknown escapes intact.
    return raw.replace("\\n", "\n").replace("\\t", "\t").replace("\\'", "'").replace('\\"', '"').replace("\\\\", "\\")


def collect_strings() -> set[str]:
    strings: set[str] = set()
    for bundle in sorted(PACKAGES.glob("*/lib/client.js")):
        text = bundle.read_text(encoding="utf-8")
        for match in STRING_RE.finditer(text):
            raw = match.group(1) if match.group(1) is not None else match.group(2)
            if raw and CJK_RE.search(raw):
                strings.add(unescape(raw))
    return strings


def main() -> None:
    out_path = Path(sys.argv[1])
    strings = collect_strings()

    chars: dict[str, str] = {}
    for s in strings:
        for ch in s:
            if ch in chars or not CJK_RE.match(ch):
                continue
            conv = zhconv.convert(ch, "zh-tw")
            if conv != ch and len(conv) == 1:
                chars[ch] = conv

    def char_convert(s: str) -> str:
        return "".join(chars.get(ch, ch) for ch in s)

    phrases: dict[str, str] = {}
    for s in sorted(strings):
        word_level = zhconv.convert(s, "zh-tw")
        if word_level != char_convert(s):
            phrases[s] = word_level

    snippet = (
        "const S2T_CHARS = JSON.parse(" + json.dumps(json.dumps(chars, ensure_ascii=False), ensure_ascii=False) + ");\n"
        "const S2T_PHRASES = JSON.parse(" + json.dumps(json.dumps(phrases, ensure_ascii=False), ensure_ascii=False) + ");\n"
        "function toTraditional(text) {\n"
        '\tconst override = S2T_PHRASES[text];\n'
        "\tif (override !== void 0) return override;\n"
        '\tlet result = "";\n'
        "\tfor (const ch of text) result += S2T_CHARS[ch] ?? ch;\n"
        "\treturn result;\n"
        "}\n"
    )
    out_path.write_text(snippet, encoding="utf-8")
    print(f"strings={len(strings)} chars={len(chars)} phrases={len(phrases)} -> {out_path}")


if __name__ == "__main__":
    main()
