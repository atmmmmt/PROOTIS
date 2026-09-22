import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Surface } from "./ui";

function ChartTooltipStyle() {
  return null;
}

export function RevenueChart({ data }: { data: Array<{ month: string; booked: number; collected: number }> }) {
  return (
    <Surface className="p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[0.9375rem] font-semibold tracking-tight text-prootech-black">الإيراد والتحصيل</h2>
          <p className="mt-0.5 text-xs text-prootech-text-muted">مقارنة شهرية بين المبوّب والمحصّل</p>
        </div>
        <div className="flex items-center gap-4 pt-0.5">
          <span className="flex items-center gap-1.5 text-[0.68rem] text-prootech-text-muted">
            <span className="h-2 w-4 rounded-full bg-prootech-violet opacity-80" />
            مبوّب
          </span>
          <span className="flex items-center gap-1.5 text-[0.68rem] text-prootech-text-muted">
            <span className="h-2 w-4 rounded-full bg-prootech-black opacity-60" />
            محصّل
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6300ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6300ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blackGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111111" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#111111" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f0eff4" vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "inherit" }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "inherit" }}
              dx={-4}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #e7e5eb",
                borderRadius: "10px",
                fontSize: "12px",
                fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(7,7,7,0.1)"
              }}
              labelStyle={{ color: "#111", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: "#71717a" }}
            />
            <Area type="monotone" dataKey="booked" stroke="#6300ff" fill="url(#violetGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#6300ff", strokeWidth: 0 }} />
            <Area type="monotone" dataKey="collected" stroke="#111111" fill="url(#blackGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#111", strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Surface>
  );
}

export function PipelineChart({ data }: { data: Array<{ stage: string; count: number; value: number }> }) {
  const colors = ["#6300ff", "#7c1fff", "#9040ff", "#aa66ff", "#c99dff", "#e4ccff"];
  return (
    <Surface className="p-5">
      <div className="mb-5">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-prootech-black">خط المبيعات</h2>
        <p className="mt-0.5 text-xs text-prootech-text-muted">قيمة الفرص حسب المرحلة</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="35%" margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#f0eff4" vertical={false} />
            <XAxis
              dataKey="stage"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#a1a1aa", fontFamily: "inherit" }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "inherit" }}
              dx={-4}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #e7e5eb",
                borderRadius: "10px",
                fontSize: "12px",
                fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(7,7,7,0.1)"
              }}
              labelStyle={{ color: "#111", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: "#71717a" }}
              cursor={{ fill: "rgba(99,0,255,0.04)" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_entry, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Surface>
  );
}
