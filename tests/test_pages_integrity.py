import os
import re

def analyze_page(filepath):
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    size_bytes = os.path.getsize(filepath)
    line_count = len(content.splitlines())
    h1_count = len(re.findall(r'<h1[\s>]', content, re.IGNORECASE))
    h2_count = len(re.findall(r'<h2[\s>]', content, re.IGNORECASE))
    link_count = len(re.findall(r'<a[\s>]', content, re.IGNORECASE))
    img_count = len(re.findall(r'<img[\s>]', content, re.IGNORECASE))
    form_count = len(re.findall(r'<form[\s>]', content, re.IGNORECASE))
    script_count = len(re.findall(r'<script[\s>]', content, re.IGNORECASE))

    return {
        "filepath": filepath,
        "bytes": size_bytes,
        "lines": line_count,
        "h1": h1_count,
        "h2": h2_count,
        "links": link_count,
        "imgs": img_count,
        "forms": form_count,
        "scripts": script_count
    }

def run():
    pages = [
        "public/transferencia/index.html",
        "public/isencaopcd/2027/index.html"
    ]
    for p in pages:
        res = analyze_page(p)
        print("Análise de " + p + ":")
        print("  - Linhas: " + str(res["lines"]))
        print("  - Bytes: " + str(res["bytes"]) + " B")
        print("  - H1: " + str(res["h1"]) + " | H2: " + str(res["h2"]))
        print("  - Links: " + str(res["links"]) + " | Imagens: " + str(res["imgs"]))
        print("  - Formulários: " + str(res["forms"]) + " | Scripts: " + str(res["scripts"]))

if __name__ == "__main__":
    run()
