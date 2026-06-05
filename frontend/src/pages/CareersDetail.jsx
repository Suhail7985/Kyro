import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { publicAPI } from '../services/api';

export default function CareersDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicAPI.getJobDetails(id)
      .then(res => setJob(res.data.job))
      .catch(() => navigate('/careers'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading job details...</div>;
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <Link to="/careers" className="text-xl font-bold text-brand-700">← Back to Careers</Link>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-8 border-b pb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
              <span className="bg-slate-100 px-3 py-1 rounded-full">{job.department}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">{job.location}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full capitalize">{job.workType}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full capitalize">{job.employmentType}</span>
            </div>
          </div>

          <div className="prose max-w-none text-slate-700 space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-slate-900">About the Role</h3>
              <p className="whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </section>

            {job.responsibilities && job.responsibilities.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-slate-900">Key Responsibilities</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {job.responsibilities.map((req, i) => <li key={i}>{req}</li>)}
                </ul>
              </section>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-slate-900">Requirements</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {job.requirements.map((req, i) => <li key={i}>{req}</li>)}
                </ul>
              </section>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-slate-900">Benefits</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {job.benefits.map((req, i) => <li key={i}>{req}</li>)}
                </ul>
              </section>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-8 -mb-8 p-8 rounded-b-3xl">
            <div>
              <p className="text-sm text-slate-500 mb-1">Ready to join us?</p>
              <p className="font-semibold text-slate-900">Apply for {job.title}</p>
            </div>
            <Link 
              to="/register" 
              state={{ redirectJobId: job._id }}
              className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-md transition-all hover:-translate-y-0.5"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
