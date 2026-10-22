"""Rebuild month-end street rate vs. in-place rent from SiteLink exports.

Usage: python3 -I build.py WORKDIR
WORKDIR holds UTF-8 TSVs: rch.tsv (Rent Change History), mimo.tsv
(Move-Ins & Move-Outs) and rr/RentRoll_YYYY-MM-DD.tsv (month-end rent rolls,
from xlsx2tsv.py). Writes agg.json (per store|type|size monthly sums) and
detail/<store>.json (per-tenancy data for the dot view). No tenant names are output.
"""
import csv, sys, collections, datetime as dt, json, os, glob

W = sys.argv[1]
START, END = dt.date(2012, 1, 1), dt.date(2026, 10, 1)


def load(path):
    rows = list(csv.reader(open(path), delimiter="\t"))
    h = rows[0]
    idx = {k: i for i, k in enumerate(h)}
    return [r for r in rows[1:] if len(r) == len(h) and r[0].strip().isdigit()], idx, rows


def p(s):
    return dt.datetime.strptime(s.split()[0], "%m/%d/%Y").date() if s.strip() else None


def f(s):
    return float(s) if s.strip() else 0.0


def grp(t):
    t = t.lower()
    if "parking" in t: return "Parking"
    if "climate" in t and "non" not in t: return "Climate"
    if "inside" in t: return "Inside non-climate"
    if "drive" in t: return "Drive-up"
    return "Other"


def dim(w, l):
    """Unit size label with the short side first, so 10x5 and 5x10 group together."""
    a, c = sorted((float(w or 0), float(l or 0)))
    return f"{a:g}x{c:g}"


def sizeb(a):
    return "S" if a <= 50 else ("M" if a <= 150 else "L")


mi, MI, _ = load(W + "/mimo.tsv")
rc, RI, rrows = load(W + "/rch.tsv")
codes = {r[0]: r[9] for r in rrows if len(r) == 24 and r[0].strip().isdigit()}

months = []
d = START
while d <= END:
    months.append(d)
    d = dt.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
MEND = [dt.date(m.year + (m.month == 12), m.month % 12 + 1, 1) - dt.timedelta(days=1) for m in months]
midx = lambda d: (d.year - START.year) * 12 + d.month - 1

# Street: standard rate at each move-in, per store + unit type + WxL, carried forward.
street = collections.defaultdict(dict)
for r in mi:
    if r[MI["MoveIn"]] == "1" and f(r[MI["dcStdRateAtMoveIn"]]) > 0:
        k = (r[0], r[MI["sUnitType"]], r[MI["Width"]], r[MI["Length"]])
        street[k][midx(p(r[MI["MoveDate"]]))] = f(r[MI["dcStdRateAtMoveIn"]])


def street_series(k):
    pts = street.get(k)
    if not pts: return None
    out, last = [], pts[min(pts)]
    for i in range(len(months)):
        last = pts.get(i, last)
        out.append(last)
    return out


# Tenancies. Current tenants: exact periods from Rent Change History.
ten = []
g = collections.defaultdict(list)
for r in rc:
    g[(r[0], r[RI["sUnitName"]], p(r[RI["dLease"]]))].append(r)
for (site, unit, lease), v in g.items():
    per = sorted((p(x[RI["dLRateFrom"]]), f(x[RI["dcNewRate"]])) for x in v)
    r0 = v[0]
    ten.append(dict(site=site, ty=r0[RI["sTypeName"]], w=r0[RI["dcWidth"]], l=r0[RI["dcLength"]],
                    a=f(r0[RI["dcArea"]]), din=lease, dout=None, per=per, exact=True))

# Departed tenants: a stay starts with a move-in or a transfer into the unit and ends with a
# move-out or a transfer out of it (transfer rows prefix the unit name with "! ").
# Raises in between are modeled at anniversaries.
unit_of = lambda r: r[MI["UnitName"]].removeprefix("! ").strip()
starts_stay = lambda r: r[MI["MoveIn"]] == "1" or r[MI["Transfer"]] == "1"
ends_stay = lambda r: r[MI["MoveOut"]] == "1" or (r[MI["MoveIn"]], r[MI["MoveOut"]], r[MI["Transfer"]]) == ("0", "0", "0")
ins = collections.defaultdict(list)
for r in mi:
    if starts_stay(r):
        ins[(r[0], r[MI["TenantID"]], unit_of(r))].append(r)
unmatched = 0
for r in mi:
    if not ends_stay(r): continue
    dout = p(r[MI["MoveDate"]])
    c = [x for x in ins.get((r[0], r[MI["TenantID"]], unit_of(r)), []) if p(x[MI["MoveDate"]]) <= dout]
    if not c:
        unmatched += 1
        continue
    x = max(c, key=lambda x: p(x[MI["MoveDate"]]))
    din = p(x[MI["MoveDate"]])
    a = f(x[MI["MovedInArea"]]) or f(r[MI["MovedOutArea"]])
    rin = f(x[MI["MovedInRentalRate"]])
    rout = f(r[MI["MovedOutRentalRate"]]) or rin
    tenure = (dout - din).days / 30.44
    per = [(din, rin)]
    if rout > rin + 0.5:
        n = max(1, int(tenure // 12))
        ratio = (rout / rin) ** (1 / n) if rin > 0 else 1
        for k in range(1, n + 1):
            dd = din + dt.timedelta(days=int(365.25 * k)) if tenure >= 12 else din + dt.timedelta(days=int(tenure * 30.44 / 2))
            per.append((dd, rin * ratio ** k if k < n else rout))
    elif rout < rin - 0.5:
        per.append((din + dt.timedelta(days=int(tenure * 30.44 / 2)), rout))
    ten.append(dict(site=r[0], ty=x[MI["sUnitType"]], w=x[MI["Width"]], l=x[MI["Length"]], a=a, din=din,
                    dout=dout, per=per, exact=abs(rout - rin) < 0.5, tid=r[MI["TenantID"]], unit=unit_of(r)))


def rent_at(per, d):
    v = None
    for dd, rr in per:
        if dd <= d: v = rr
    return v if v is not None else per[0][1]


# Month-end rent rolls: replace modeled rent for departed tenants with actual rent.
snap, snap_std = {}, {}
for fpath in sorted(glob.glob(W + "/rr/RentRoll_*.tsv")):
    i = midx(dt.date.fromisoformat(os.path.basename(fpath)[9:19]))
    rows = list(csv.reader(open(fpath), delimiter="\t"))
    J = {k: n for n, k in enumerate(rows[0])}
    m, s = {}, {}
    for r in rows[1:]:
        if len(r) < len(rows[0]): continue
        s[(r[0], r[J["sUnitName"]])] = f(r[J["dcStdRate"]])
        if r[J["bRented"]] == "1" and r[J["TenantID"]].strip():
            m[(r[0], r[J["TenantID"]], r[J["sUnitName"]])] = f(r[J["dcRent"]])
    snap[i], snap_std[i] = m, s
SNAP_IDX = sorted(snap)

err, sm, sa, hit = [], 0, 0, 0
for t in ten:
    if t["dout"] is None: continue
    k = (t["site"], t["tid"], t["unit"])
    act = {i: snap[i][k] for i in SNAP_IDX if t["din"] <= MEND[i] < t["dout"] and snap[i].get(k, 0) > 0}
    if not act: continue
    hit += 1
    if not t["exact"]:
        for i, a in act.items():
            m = rent_at(t["per"], MEND[i])
            err.append(abs(m / a - 1)); sm += m; sa += a
    first = min(act)
    per = [x for x in t["per"] if x[0] <= MEND[first - 1]] or [t["per"][0]]
    per += [(months[i], act[i]) for i in sorted(act)]
    if t["dout"] > MEND[max(act)]: per.append((t["dout"], t["per"][-1][1]))
    t["per"], t["exact_from"] = per, first
err.sort()
print("tenancies", len(ten), "unmatched move-outs", unmatched, "| snapshots", len(SNAP_IDX),
      "| departed tenancies matched to snapshots", hit)
if err:
    print("model check, departed tenants with raises: tenant-months %d, modeled/actual %.4f, median abs err %.1f%%, 90th pct %.1f%%"
          % (len(err), sm / sa, 100 * err[len(err) // 2], 100 * err[int(len(err) * .9)]))

# Street check: carried-forward std at move-in vs. the rent roll's std rate for occupied units.
cf = ss = 0
for t in ten:
    if grp(t["ty"]) == "Parking": continue
    sser = street_series((t["site"], t["ty"], t["w"], t["l"]))
    for i in SNAP_IDX:
        e = MEND[i]
        if t["din"] > e or (t["dout"] and t["dout"] <= e): continue
        u = t.get("unit") or None
        if sser and u and (t["site"], u) in snap_std[i]:
            cf += sser[i]; ss += snap_std[i][(t["site"], u)]
if ss: print("street check (departed tenants' units): carried-forward / rent roll std = %.4f" % (cf / ss))

# Aggregate per store|group|size.
agg = collections.defaultdict(lambda: {k: [0.0] * len(months) for k in ("rent", "area", "st", "mod", "n")})
for t in ten:
    if t["a"] <= 0: continue
    key = f"{codes.get(t['site'], t['site'])}|{grp(t['ty'])}|{dim(t['w'], t['l'])}"
    sser = street_series((t["site"], t["ty"], t["w"], t["l"]))
    A = agg[key]
    for i in range(max(0, midx(t["din"])), len(months)):
        e = MEND[i]
        if t["din"] > e: continue
        if t["dout"] and t["dout"] <= e: break
        rent = rent_at(t["per"], e)
        A["rent"][i] += rent; A["area"][i] += t["a"]; A["n"][i] += 1
        A["st"][i] += sser[i] if sser else rent
        if not t["exact"] and i < t.get("exact_from", 10 ** 6): A["mod"][i] += rent

mv = collections.defaultdict(lambda: {k: [0.0] * len(months) for k in ("r", "a")})
for r in mi:
    if r[MI["MoveIn"]] != "1": continue
    d, a = p(r[MI["MoveDate"]]), f(r[MI["MovedInArea"]])
    if d < START or d > MEND[-1] or a <= 0: continue
    key = f"{codes.get(r[0], r[0])}|{grp(r[MI['sUnitType']])}|{dim(r[MI['Width']], r[MI['Length']])}"
    mv[key]["r"][midx(d)] += f(r[MI["MovedInRentalRate"]]); mv[key]["a"][midx(d)] += a

# Occupancy from SiteLink Occupied History reports (oh/OccupiedHistory_YYYYMMDD_*.tsv). Each
# report has, per store / unit type / size, total units as of the report date and occupied
# units for 14 months, M01 = the report's month. Later reports win where windows overlap.
occ = collections.defaultdict(lambda: {k: [0.0] * len(months) for k in ("occ", "tot")})
for fpath in sorted(glob.glob(W + "/oh/OccupiedHistory_*.tsv")):
    rd = os.path.basename(fpath).split("_")[1]
    m0 = midx(dt.date(int(rd[:4]), int(rd[4:6]), 1))
    rows = list(csv.reader(open(fpath), delimiter="\t"))
    hdr = next(i for i, r in enumerate(rows) if r[:4] == ["SiteID", "sSiteAddress", "sSiteCode", "UnitType"])
    J = {k: n for n, k in enumerate(rows[hdr])}
    filled = set()
    for r in rows[hdr + 1:]:
        if len(r) < J["M14"] + 1 or not r[0].isdigit(): break
        w, l = r[J["Size"]].split("x") if "x" in r[J["Size"]] else (0, 0)
        key = f"{codes.get(r[0], r[0])}|{grp(r[J['UnitType']])}|{dim(w, l)}"
        for j in range(14):
            i = m0 - j
            if not 0 <= i < len(months): continue
            if (key, i) not in filled:  # first row of this key in this report resets the month
                filled.add((key, i)); occ[key]["occ"][i] = occ[key]["tot"][i] = 0
            occ[key]["occ"][i] += f(r[J[f"M{j + 1:02d}"]])
            occ[key]["tot"][i] += f(r[J["TotalUnits"]])
# A store's units only count toward occupancy once it has tenants (a report's total units
# would otherwise include stores in months before they were acquired).
store_occ = collections.Counter()
for k, O in occ.items():
    for i, x in enumerate(O["occ"]): store_occ[(k.split("|")[0], i)] += x
for k, O in occ.items():
    for i in range(len(months)):
        if not store_occ[(k.split("|")[0], i)]: O["tot"][i] = 0
out = {"months": [m.strftime("%Y-%m") for m in months], "series": {}}
for k in set(agg) | set(mv) | set(occ):
    A, M, O = agg[k], mv[k], occ[k]
    arrs = [[round(x) for x in A[c]] for c in ("rent", "area", "st", "mod")] + \
        [[int(x) for x in A["n"]], [round(x) for x in M["r"]], [round(x) for x in M["a"]], [int(x) for x in O["occ"]], [int(x) for x in O["tot"]]]
    nz = [next((i for i, x in enumerate(a) if x), len(a)) for a in arrs]
    off = min(nz)
    if off == len(months): continue
    out["series"][k] = [off] + [a[off:] for a in arrs]
json.dump(out, open(W + "/agg.json", "w"), separators=(",", ":"))

# Per-tenancy detail for the dot view, one file per store: detail/<code>.json.
yr = lambda d: round(d.year + (d.timetuple().tm_yday - 1) / 365.25, 3)
det, skeys = collections.defaultdict(list), collections.defaultdict(dict)
for t in ten:
    if t["a"] <= 0 or (t["dout"] and t["dout"] < START): continue
    code = codes.get(t["site"], t["site"])
    sk = f"{t['ty']}|{t['w']}|{t['l']}"
    if sk not in skeys[code]:
        sser = street_series((t["site"], t["ty"], t["w"], t["l"]))
        skeys[code][sk] = [round(x, 2) for x in sser] if sser else None
    steps = []
    for dd, rr in t["per"]:
        i = max(0, midx(dd))
        if steps and steps[-1][0] == i: steps[-1][1] = round(rr, 2)
        else: steps.append([i, round(rr, 2)])
    det[code].append([yr(t["din"]), midx(t["dout"]) if t["dout"] else None, round(t["a"]), grp(t["ty"]), sizeb(t["a"]),
                      sk, steps, 1 if t["exact"] or "exact_from" in t else 0, dim(t['w'], t['l'])])
os.makedirs(W + "/detail", exist_ok=True)
for code, rows in det.items():
    json.dump({"t": rows, "street": skeys[code]}, open(f"{W}/detail/{code}.json", "w"), separators=(",", ":"))
print("agg KB", os.path.getsize(W + "/agg.json") // 1024, "| detail stores", len(det),
      "| detail tenancies", sum(len(v) for v in det.values()))
