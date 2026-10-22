"""Inline agg.json from WORKDIR into page.html and copy the per-store dot view files
next to it. Usage: render.py WORKDIR OUT.html  (detail files go to OUT_detail/)"""
import os, shutil, sys

w, out = sys.argv[1], sys.argv[2]
page = open(os.path.join(os.path.dirname(__file__), "page.html")).read()
detail_dir = os.path.splitext(out)[0] + "_detail"
page = page.replace("__DATA__", open(w + "/agg.json").read()).replace("__DETAIL_DIR__", os.path.basename(detail_dir))
open(out, "w").write(page)
shutil.rmtree(detail_dir, ignore_errors=True)
shutil.copytree(w + "/detail", detail_dir)
