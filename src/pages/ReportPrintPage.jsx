import { useMemo } from 'react';

const reportData = {
  title: 'OMA Aircraft Temps Report',
  dateRange: 'Jan 14–16, 2026',
  aircraft: [
    {
      tailNumber: 'N253NN',
      nightDate: 'Jan 14, 2026',
      heatSource: 'HG014',
      goodTemp: true,
      purged: true,
      purgedAt: 'Jan 14, 10:45 PM',
      latestTemp: 69,
      averageTemp: 69.7,
      trendPerHour: -0.44,
      range: '69–70°F',
      duration: '2.3 hrs',
      window: '9:45 PM – 12:02 AM',
      logs: [
        { time: '09:45 PM', temperature: '70.0°', recordedBy: 'kimberly.robinson1@aa.com' },
        { time: '09:45 PM', temperature: '70.0°', recordedBy: 'kimberly.robinson1@aa.com' },
        { time: '12:02 AM', temperature: '69.0°', recordedBy: 'toiya.higgins@aa.com' },
      ],
      notes: [],
    },
    {
      tailNumber: 'N344PP',
      nightDate: 'Jan 14, 2026',
      heatSource: 'AC0066',
      goodTemp: false,
      purged: false,
      purgedAt: null,
      latestTemp: 91,
      averageTemp: 88.3,
      trendPerHour: 5.49,
      range: '76–98°F',
      duration: '2.7 hrs',
      window: '1:16 AM – 4:00 AM',
      logs: [
        { time: '01:16 AM', temperature: '76.0°', recordedBy: 'toiya.higgins@aa.com' },
        { time: '02:22 AM', temperature: '88.0°', recordedBy: 'toiya.higgins@aa.com' },
        { time: '03:29 AM', temperature: '98.0°', recordedBy: 'toiya.higgins@aa.com' },
        { time: '04:00 AM', temperature: '91.0°', recordedBy: 'toiya.higgins@aa.com' },
      ],
      notes: ['Note: Marked in at 23:51 pm'],
    },
  ],
};

function formatTrend(trend) {
  const sign = trend >= 0 ? '+' : '';
  return `${sign}${trend.toFixed(2)}°F/hr`;
}

export default function ReportPrintPage() {
  const summary = useMemo(() => {
    const totalAircraft = reportData.aircraft.length;
    const purgedCount = reportData.aircraft.filter((aircraft) => aircraft.purged).length;
    const notPurged = totalAircraft - purgedCount;
    const avgFleetTemp =
      reportData.aircraft.reduce((sum, aircraft) => sum + aircraft.averageTemp, 0) / totalAircraft;
    const highest = reportData.aircraft.reduce((max, aircraft) => (
      aircraft.latestTemp > max.latestTemp ? aircraft : max
    ), reportData.aircraft[0]);
    const fastestRise = reportData.aircraft.reduce((max, aircraft) => (
      aircraft.trendPerHour > max.trendPerHour ? aircraft : max
    ), reportData.aircraft[0]);

    return {
      totalAircraft,
      purgedCount,
      notPurged,
      avgFleetTemp: avgFleetTemp.toFixed(1),
      highestTemp: `${highest.latestTemp}°F (${highest.tailNumber})`,
      fastestRise: `${fastestRise.tailNumber} ${formatTrend(fastestRise.trendPerHour)}`,
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 print-report-page">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div className="report-print-surface report-print-header">
            <h1 className="text-3xl font-bold">{reportData.title}</h1>
            <p className="text-sm text-slate-200">{reportData.dateRange}</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="print-hidden px-4 py-2 rounded-lg text-sm font-semibold border bg-brand text-slate-900 border-brand"
          >
            Print
          </button>
        </div>

        <div className="report-print-surface report-summary-card">
          <h2 className="text-lg font-semibold mb-3">Summary Overview</h2>
          <ul className="report-summary-list text-sm text-slate-200">
            <li className="report-summary-item">Total Aircraft: <span className="font-semibold">{summary.totalAircraft}</span></li>
            <li className="report-summary-item">Purged: <span className="font-semibold">{summary.purgedCount}</span></li>
            <li className="report-summary-item">Not Purged: <span className="font-semibold">{summary.notPurged}</span></li>
            <li className="report-summary-item">Avg Fleet Temp: <span className="font-semibold">{summary.avgFleetTemp}°F</span></li>
            <li className="report-summary-item">Highest Temp: <span className="font-semibold">{summary.highestTemp}</span></li>
            <li className="report-summary-item">Fastest Rise: <span className="font-semibold">{summary.fastestRise}</span></li>
          </ul>
        </div>

        <div className="space-y-6">
          {reportData.aircraft.map((aircraft, index) => {
            const headerClass = aircraft.purged || aircraft.goodTemp
              ? 'report-card-header-green'
              : 'report-card-header-red';
            return (
              <div
                key={aircraft.tailNumber}
                className={`report-print-surface report-aircraft-card print-avoid-break ${
                  index > 0 ? 'print-page-break' : ''
                }`}
              >
                <div className={`px-4 py-3 rounded-t-xl flex items-center justify-between ${headerClass}`}>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold">{aircraft.tailNumber}</p>
                    <span className="text-sm opacity-90">|</span>
                    <p className="text-sm">{aircraft.nightDate}</p>
                  </div>
                </div>

                <div className="grid gap-4 px-4 py-4 md:grid-cols-[1fr,2fr]">
                  <div className="space-y-3 text-sm text-slate-200">
                    <div>
                      <p className="text-slate-400">Heat Source</p>
                      <p className="font-semibold">{aircraft.heatSource}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Purge Status</p>
                      <p className="font-semibold">
                        {aircraft.purged ? '✔ Purged' : '✖ Not Purged'}
                        {aircraft.purgedAt ? ` · ${aircraft.purgedAt}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 report-status-strip">
                    <div className="text-3xl font-bold">{aircraft.latestTemp}°F</div>
                    <div className="text-sm text-slate-200">
                      Latest · Avg {aircraft.averageTemp}°F · Trend: {formatTrend(aircraft.trendPerHour)}
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="h-40 rounded-lg border border-slate-700 bg-slate-900/40 flex items-center justify-center text-sm text-slate-400 report-chart-placeholder">
                    Trend chart placeholder
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    Range: {aircraft.range} · Duration: {aircraft.duration} · Window: {aircraft.window}
                  </p>
                </div>

                <div className="px-4 pb-4">
                  <div className="overflow-hidden rounded-lg border border-slate-700 report-table">
                    <table className="min-w-full text-sm text-left">
                      <thead className="bg-slate-900/70 text-slate-200">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Time</th>
                          <th className="px-3 py-2 font-semibold">Temperature</th>
                          <th className="px-3 py-2 font-semibold">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aircraft.logs.map((log, logIndex) => (
                          <tr key={`${aircraft.tailNumber}-${logIndex}`} className={logIndex % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/20'}>
                            <td className="px-3 py-2">{log.time}</td>
                            <td className="px-3 py-2 font-semibold">{log.temperature}</td>
                            <td className="px-3 py-2 truncate max-w-[220px]" title={log.recordedBy}>
                              {log.recordedBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="px-4 pb-4 text-sm">
                  {aircraft.notes.length === 0 ? (
                    <p className="text-slate-300 flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-600 text-xs">🗒</span>
                      No Notes
                    </p>
                  ) : (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-slate-200">
                      {aircraft.notes.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
