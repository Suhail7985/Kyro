import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export function StatusPieChart({ statusBreakdown }) {
  const labels = Object.keys(statusBreakdown || {});
  const data = Object.values(statusBreakdown || {});
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!labels.length) {
    return <p className="text-slate-500 text-sm">No application data yet.</p>;
  }

  return (
    <Pie
      data={{
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, labels.length),
          },
        ],
      }}
      options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
    />
  );
}

export function SkillsBarChart({ topSkills }) {
  const skills = topSkills || [];
  if (!skills.length) {
    return <p className="text-slate-500 text-sm">No skill data yet.</p>;
  }

  return (
    <Bar
      data={{
        labels: skills.map((s) => s.skill),
        datasets: [
          {
            label: 'Candidates with skill',
            data: skills.map((s) => s.count),
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } },
      }}
    />
  );
}

export function ScoreDistributionChart({ scoreDistribution }) {
  const d = scoreDistribution || { high: 0, medium: 0, low: 0 };
  return (
    <Bar
      data={{
        labels: ['High (70+)', 'Medium (40-69)', 'Low (<40)'],
        datasets: [
          {
            label: 'Applications',
            data: [d.high, d.medium, d.low],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } },
      }}
    />
  );
}
