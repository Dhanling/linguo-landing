# Kecilkan VRM tanpa membuang ekstensi VRMC_*:
# - morph target: buang NORMAL, POSITION jadi accessor sparse
# - thumbnail diperkecil (sips), buffer dirapatkan ulang
import sys, json, struct, array, subprocess, tempfile, os
src, dst = sys.argv[1], sys.argv[2]
with open(src, 'rb') as f:
    data = f.read()
clen = struct.unpack_from('<I', data, 12)[0]
j = json.loads(data[20:20 + clen])
off = 20 + clen
blen = struct.unpack_from('<I', data, off)[0]
BIN = data[off + 8: off + 8 + blen]
acc, bv = j['accessors'], j['bufferViews']

def view_bytes(i):
    b = bv[i]; o = b.get('byteOffset', 0); return BIN[o:o + b['byteLength']]

new_views, chunks = [], []
cur = 0
def add_view(raw, extra=None):
    global cur
    pad = (-cur) % 4
    if pad: chunks.append(b'\0' * pad); cur += pad
    v = {'buffer': 0, 'byteOffset': cur, 'byteLength': len(raw)}
    if extra: v.update(extra)
    chunks.append(raw); cur += len(raw)
    new_views.append(v); return len(new_views) - 1

# thumbnail
thumb = None
meta = j.get('extensions', {}).get('VRMC_vrm', {}).get('meta', {})
if 'thumbnailImage' in meta: thumb = meta['thumbnailImage']

target_pos, drop_acc = set(), set()
for me in j['meshes']:
    for pr in me['primitives']:
        for t in pr.get('targets', []):
            if 'NORMAL' in t: drop_acc.add(t.pop('NORMAL'))
            if 'TANGENT' in t: drop_acc.add(t.pop('TANGENT'))
            if 'POSITION' in t: target_pos.add(t['POSITION'])

remap = {}
for i, b in enumerate(bv):
    users = [k for k, a in enumerate(acc) if a.get('bufferView') == i]
    if users and all(k in drop_acc or k in target_pos for k in users):
        continue  # diganti di bawah
    raw = view_bytes(i)
    imgs = [im for im in j.get('images', []) if im.get('bufferView') == i]
    if imgs and thumb is not None and j['images'][thumb].get('bufferView') == i:
        with tempfile.TemporaryDirectory() as d:
            a, z = os.path.join(d, 'a.png'), os.path.join(d, 'b.png')
            open(a, 'wb').write(raw)
            subprocess.run(['sips', '-Z', '256', a, '--out', z], check=True, capture_output=True)
            raw = open(z, 'rb').read()
    extra = {k: b[k] for k in ('byteStride', 'target') if k in b}
    remap[i] = add_view(raw, extra)

for k, a in enumerate(acc):
    if k in target_pos:
        assert a['componentType'] == 5126 and a['type'] == 'VEC3'
        b = bv[a['bufferView']]
        stride = b.get('byteStride', 12)
        base = b.get('byteOffset', 0) + a.get('byteOffset', 0)
        idx, vals = array.array('H' if a['count'] < 65536 else 'I'), array.array('f')
        for n in range(a['count']):
            x, y, z = struct.unpack_from('<3f', BIN, base + n * stride)
            if abs(x) > 1e-6 or abs(y) > 1e-6 or abs(z) > 1e-6:
                idx.append(n); vals.extend((x, y, z))
        a.pop('bufferView'); a.pop('byteOffset', None)
        if len(idx):
            a['sparse'] = {'count': len(idx),
                           'indices': {'bufferView': add_view(idx.tobytes()), 'componentType': 5123 if idx.typecode == 'H' else 5125},
                           'values': {'bufferView': add_view(vals.tobytes())}}
    elif k in drop_acc:
        a.pop('bufferView', None); a.pop('byteOffset', None)
    elif 'bufferView' in a:
        a['bufferView'] = remap[a['bufferView']]
    if 'sparse' in a and k not in target_pos:
        raise SystemExit('sparse lama tak didukung')

for im in j.get('images', []):
    if 'bufferView' in im: im['bufferView'] = remap[im['bufferView']]
# accessor NORMAL target yang dibuang: biarkan ada tapi tanpa data (tak dirujuk) → jadikan zero accessor kecil
for k in drop_acc:
    acc[k].pop('bufferView', None); acc[k].pop('byteOffset', None)

j['bufferViews'] = new_views
newbin = b''.join(chunks); newbin += b'\0' * ((-len(newbin)) % 4)
j['buffers'] = [{'byteLength': len(newbin)}]
js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
out = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(newbin)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(newbin), 0x004E4942) + newbin
open(dst, 'wb').write(out)
print(dst, round(len(data) / 1e6, 2), '→', round(len(out) / 1e6, 2), 'MB')
