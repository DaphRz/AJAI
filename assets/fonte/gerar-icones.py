"""Rasteriza o símbolo do AJAI (vetor do Figma, viewBox 144x144) em PNG, sem dependências."""
import re, struct, sys, zlib

P = ("M72 69.1114C57.6 57.2782 37.44 55.799 20.16 60.2365V114.965C40.32 109.048 59.04 113.486 72 123.84"
     "C84.96 113.486 103.68 109.048 123.84 114.965V60.2365C105.12 55.799 86.4 57.2782 72 69.1114Z"
     "M69.12 70.5905H74.88V114.965L72 117.923L69.12 114.965V70.5905Z"
     "M33.12 75.028C43.68 73.0558 53.28 74.535 61.92 79.4655V83.9029C53.28 78.9724 43.68 77.4933 33.12 79.4655V75.028Z"
     "M33.12 89.8195C43.68 87.8473 53.28 89.3265 61.92 94.257V98.6944C53.28 93.7639 43.68 92.2848 33.12 94.257V89.8195Z"
     "M82.08 79.4655C90.72 74.535 100.32 73.0558 110.88 75.028V79.4655C100.32 77.4933 90.72 78.9724 82.08 83.9029V79.4655Z"
     "M82.08 94.257C90.72 89.3265 100.32 87.8473 110.88 89.8195V94.257C100.32 92.2848 90.72 93.7639 82.08 98.6944V94.257Z"
     "M70.56 52.8407C50.4 52.8407 46.08 36.5701 46.08 27.6952C64.8 26.216 73.44 36.5701 70.56 52.8407Z"
     "M76.32 48.4033C73.44 29.1743 84.96 18.8202 102.24 20.2994C102.24 38.0492 90.72 48.4033 76.32 48.4033Z")


def poligonos(d):
    toks = re.findall(r"[MCVHLZ]|-?\d*\.?\d+", d)
    i, polys, cur, x, y, cmd = 0, [], [], 0.0, 0.0, None
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
            if cmd == "Z":
                polys.append(cur); cur = []
            continue
        n = lambda k: float(toks[i + k])
        if cmd == "M":
            x, y = n(0), n(1); cur = [(x, y)]; i += 2
        elif cmd == "L":
            x, y = n(0), n(1); cur.append((x, y)); i += 2
        elif cmd == "H":
            x = n(0); cur.append((x, y)); i += 1
        elif cmd == "V":
            y = n(0); cur.append((x, y)); i += 1
        elif cmd == "C":
            x1, y1, x2, y2, x3, y3 = (n(k) for k in range(6))
            for s in range(1, 25):
                u = s / 24
                a, b, c, e = (1 - u) ** 3, 3 * (1 - u) ** 2 * u, 3 * (1 - u) * u * u, u ** 3
                cur.append((a * x + b * x1 + c * x2 + e * x3, a * y + b * y1 + c * y2 + e * y3))
            x, y = x3, y3; i += 6
    return polys


def dentro_par_impar(polys, px, py):
    dentro = False
    for poly in polys:
        n = len(poly)
        for k in range(n):
            (x1, y1), (x2, y2) = poly[k], poly[(k + 1) % n]
            if (y1 > py) != (y2 > py) and px < x1 + (py - y1) * (x2 - x1) / (y2 - y1):
                dentro = not dentro
    return dentro


def dentro_ret_arred(px, py, r):
    if r <= 0:
        return 0 <= px <= 144 and 0 <= py <= 144
    cx = min(max(px, r), 144 - r); cy = min(max(py, r), 144 - r)
    return 0 <= px <= 144 and 0 <= py <= 144 and (px - cx) ** 2 + (py - cy) ** 2 <= r * r


def hexrgb(h):
    return tuple(int(h[k:k + 2], 16) for k in (1, 3, 5))


def gerar(saida, tam, fundo=None, raio=0.0, cor="#17594D", escala=1.0, amostras=3):
    polys = [[(72 + (x - 72) * escala, 72 + (y - 72) * escala) for x, y in p] for p in poligonos(P)]
    # cache de intervalos por linha para acelerar: lista de arestas
    arestas = []
    for poly in polys:
        for k in range(len(poly)):
            arestas.append((poly[k], poly[(k + 1) % len(poly)]))
    cf = hexrgb(fundo) if fundo else None
    cl = hexrgb(cor)
    linhas = bytearray()
    passo = 144 / tam
    for j in range(tam):
        linhas.append(0)
        subs = [(j + (sj + 0.5) / amostras) * passo for sj in range(amostras)]
        # cruzamentos por sub-linha
        cruz = []
        for py in subs:
            xs = sorted(x1 + (py - y1) * (x2 - x1) / (y2 - y1)
                        for (x1, y1), (x2, y2) in arestas if (y1 > py) != (y2 > py))
            cruz.append(xs)
        for i in range(tam):
            livro = fundo_a = 0
            for si, py in enumerate(subs):
                xs = cruz[si]
                for sx in range(amostras):
                    px = (i + (sx + 0.5) / amostras) * passo
                    if cf and dentro_ret_arred(px, py, raio):
                        fundo_a += 1
                    c = 0
                    for v in xs:
                        if v > px: break
                        c += 1
                    if c % 2: livro += 1
            tot = amostras * amostras
            al, af = livro / tot, fundo_a / tot
            # livro por cima do fundo
            a = al + af * (1 - al)
            if a == 0:
                linhas += b"\0\0\0\0"; continue
            rgb = [round((cl[k] * al + (cf[k] if cf else 0) * af * (1 - al)) / a) for k in range(3)]
            linhas += bytes(rgb + [round(a * 255)])
    def bloco(tipo, dados):
        return struct.pack(">I", len(dados)) + tipo + dados + struct.pack(">I", zlib.crc32(tipo + dados) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n" + bloco(b"IHDR", struct.pack(">IIBBBBB", tam, tam, 8, 6, 0, 0, 0)) \
        + bloco(b"IDAT", zlib.compress(bytes(linhas), 9)) + bloco(b"IEND", b"")
    open(saida, "wb").write(png)
    print(saida, tam)


if __name__ == "__main__":  # uso: python3 assets/fonte/gerar-icones.py assets/images
    d = sys.argv[1]
    VERDE, CLARO = "#17594D", "#EAF2E9"
    gerar(f"{d}/icon.png", 1024, fundo=CLARO)                       # iOS e geral: quadrado opaco
    gerar(f"{d}/simbolo.png", 432, fundo=CLARO, raio=40.32)         # logo no app (até 144 pt @3x)
    gerar(f"{d}/splash-icon.png", 432, fundo=CLARO, raio=40.32)     # splash nativa
    gerar(f"{d}/favicon.png", 48, fundo=CLARO, raio=40.32, amostras=6)
    gerar(f"{d}/android-icon-foreground.png", 1024, escala=0.62)    # zona segura do ícone adaptativo
    gerar(f"{d}/android-icon-monochrome.png", 1024, escala=0.62, cor="#000000")
