# Rate erosion prototype

Builds `docs/RateErosionPrototype.html` (street rate vs. in-place rent) from
SiteLink exports. All inputs and the output contain business data and stay out
of git via `.git/info/exclude`; only these scripts are tracked.

Inputs in `docs/`:
- `RentChangeHistory_*.txt` (Operations > Rent Change History)
- `MoveInsAndMoveOuts_*.txt` (Operations > Move-Ins & Move-Outs)
- `RentRoll month-end/RentRoll_YYYY-MM-DD.xlsx` (from `../exportMonthEndRentRolls.gs`)
- `OccupiedHistory_*.txt` (Management > Occupied History, one per year; each covers 14 months)

```bash
W=$(mktemp -d)
iconv -f UTF-16 -t UTF-8 docs/RentChangeHistory_*.txt > $W/rch.tsv
iconv -f UTF-16 -t UTF-8 docs/MoveInsAndMoveOuts_*.txt > $W/mimo.tsv
mkdir $W/oh && for f in docs/OccupiedHistory_*.txt; do iconv -f UTF-16 -t UTF-8 "$f" > $W/oh/$(basename "$f" .txt).tsv; done
mkdir $W/rr && python3 -I scripts/rate-erosion/xlsx2tsv.py $W/rr docs/RentRoll\ month-end/*.xlsx
python3 -I scripts/rate-erosion/build.py $W
python3 -I scripts/rate-erosion/render.py $W docs/RateErosionPrototype.html
```

View it with the `docs-static` entry in `.claude/launch.json`
(http://localhost:8765/RateErosionPrototype.html).
