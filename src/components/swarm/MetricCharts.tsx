import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MetricTracker } from '../../types';
import { PARTNER_LABELS } from '../../lib/swarmLabels';

interface MetricChartsProps {
  metrics: MetricTracker[];
}

export default function MetricCharts({ metrics }: MetricChartsProps) {
  const rows = metrics.map((metric) => ({
    name: PARTNER_LABELS[metric.partner],
    views: metric.views,
    rpm: metric.rpmUsd,
    ads: metric.estimatedAdRevenueUsd,
    affiliate: metric.estimatedAffiliateRevenueUsd,
  }));

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">RPM / views / indtjening</h2>
        <p className="text-sm text-zinc-400 mt-3">Ingen metrics at plotte.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">RPM / views / indtjening</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} interval={0} angle={-18} height={50} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a' }} />
              <Legend />
              <Bar dataKey="views" fill="#C8F24A" name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} interval={0} angle={-18} height={50} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#09090b', border: '1px solid #27272a' }} />
              <Legend />
              <Line type="monotone" dataKey="rpm" stroke="#F5C542" name="RPM USD" />
              <Line type="monotone" dataKey="ads" stroke="#FF4D4D" name="Ads USD" />
              <Line type="monotone" dataKey="affiliate" stroke="#69C9D0" name="Affiliate USD" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
