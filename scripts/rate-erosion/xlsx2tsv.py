import zipfile,sys,re,xml.etree.ElementTree as ET
NS='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
def col(ref):
    n=0
    for ch in re.match(r'[A-Z]+',ref).group(): n=n*26+ord(ch)-64
    return n-1
def conv(src,dst):
    z=zipfile.ZipFile(src); ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        for ev,el in ET.iterparse(z.open('xl/sharedStrings.xml')):
            if el.tag==NS+'si': ss.append(''.join(t.text or '' for t in el.iter(NS+'t'))); el.clear()
    sheet=sorted(n for n in z.namelist() if n.startswith('xl/worksheets/sheet'))[0]
    out=open(dst,'w'); n=0
    for ev,el in ET.iterparse(z.open(sheet)):
        if el.tag==NS+'row':
            vals={}
            for c in el.iter(NS+'c'):
                v=c.find(NS+'v'); t=c.get('t')
                if t=='inlineStr': s=''.join(x.text or '' for x in c.iter(NS+'t'))
                elif v is None: s=''
                elif t=='s': s=ss[int(v.text)]
                else: s=v.text
                vals[col(c.get('r'))]=s.replace('\t',' ').replace('\n',' ')
            if vals: out.write('\t'.join(vals.get(i,'') for i in range(max(vals)+1))+'\n'); n+=1
            el.clear()
    return n
for src in sys.argv[2:]:
    import os; dst=os.path.join(sys.argv[1],os.path.basename(src).replace('.xlsx','.tsv')); print(os.path.basename(src),conv(src,dst))
