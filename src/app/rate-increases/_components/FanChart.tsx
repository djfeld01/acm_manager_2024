"use client";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface FanBand {
  /** Key in each data row holding [low, high]. */
  key: string;
  name: string;
  color: string;
}

export interface FanLine {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
  thin?: boolean;
}

type Row = { label: string } & Record<string, number | string | [number, number]>;

/** Round axis values (1, 2, 5 x a power of ten) covering the data. */
function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const raw = (max - min) / (count - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

interface Props {
  title: string;
  description?: string;
  data: Row[];
  bands: FanBand[];
  lines: FanLine[];
  /** A horizontal reference, e.g. today's income. */
  reference?: { value: number; label: string };
  format: (n: number) => string;
  /** Axis label format; defaults to `format`. */
  axisFormat?: (n: number) => string;
  height?: number;
}

/** A line chart with shaded bands: the line is the middle outcome, the band is the range. */
export function FanChart({ title, description, data, bands, lines, reference, format, axisFormat, height = 340 }: Props) {
  const axis = axisFormat ?? format;
  // Axis range from everything drawn (and the reference line), padded to round numbers.
  const values: number[] = reference ? [reference.value] : [];
  for (const row of data) {
    for (const v of Object.values(row)) {
      if (typeof v === "number") values.push(v);
      else if (Array.isArray(v)) values.push(v[0], v[1]);
    }
  }
  const ticks = values.length ? niceTicks(Math.min(...values), Math.max(...values)) : undefined;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          {bands.map((b) => (
            <span key={b.key} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-sm" style={{ backgroundColor: b.color, opacity: 0.28 }} />
              {b.name}
            </span>
          ))}
          {lines.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-4 border-t-2"
                style={{ borderColor: l.color, borderTopStyle: l.dashed ? "dashed" : "solid", opacity: l.thin ? 0.7 : 1 }}
              />
              {l.name}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
              <XAxis dataKey="label" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
              <YAxis
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={axis}
                ticks={ticks}
                domain={ticks && ticks.length > 1 ? [ticks[0]!, ticks[ticks.length - 1]!] : ["auto", "auto"]}
                allowDataOverflow
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]!.payload as Row;
                  return (
                    <div className="rounded-md border border-border bg-card p-3 text-sm shadow-lg">
                      <div className="mb-2 font-medium">{label}</div>
                      {bands.map((b) => {
                        const v = row[b.key] as [number, number] | undefined;
                        return v ? (
                          <div key={b.key} className="flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: b.color, opacity: 0.5 }} />
                            <span className="text-muted-foreground">{b.name}:</span>
                            <span className="font-medium">
                              {format(v[0])} to {format(v[1])}
                            </span>
                          </div>
                        ) : null;
                      })}
                      {lines.map((l) => {
                        const v = row[l.key] as number | undefined;
                        return typeof v === "number" ? (
                          <div key={l.key} className="flex items-center gap-2">
                            <span className="inline-block h-0.5 w-3" style={{ backgroundColor: l.color }} />
                            <span className="text-muted-foreground">{l.name}:</span>
                            <span className="font-medium">{format(v)}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  );
                }}
              />
              {reference && (
                <ReferenceLine y={reference.value} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="2 4" label={{ value: reference.label, position: "insideTopLeft", fontSize: 11, fill: "currentColor", opacity: 0.6 }} />
              )}
              {bands.map((b) => (
                <Area key={b.key} dataKey={b.key} name={b.name} stroke="none" fill={b.color} fillOpacity={0.2} isAnimationActive={false} activeDot={false} />
              ))}
              {lines.map((l) => (
                <Line
                  key={l.key}
                  dataKey={l.key}
                  name={l.name}
                  stroke={l.color}
                  strokeWidth={l.thin ? 1.5 : 2.5}
                  strokeOpacity={l.thin ? 0.75 : 1}
                  strokeDasharray={l.dashed ? "5 4" : undefined}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
