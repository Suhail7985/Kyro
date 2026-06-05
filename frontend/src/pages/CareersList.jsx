import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { publicAPI } from '../services/api';

export default function CareersList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    publicAPI.browseJobs({ search, department })
      .then(res => setJobs(res.data.jobs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, department]);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-brand-700">Kyro Careers</Link>
        <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-brand-600">Employee Login</Link>
      </nav>

      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Join Our Team</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We're building the future of AI-powered HR. Discover your next career opportunity below.
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Search by role, keyword..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field flex-1"
          />
          <select 
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input-field w-48"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Sales">Sales</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading open positions...</div>
        ) : (
          <div className="grid gap-4">
            {jobs.map(job => (
              <Link 
                key={job._id} 
                to={`/careers/${job._id}`}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex justify-between items-center"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
                  <div className="flex gap-3 text-sm text-slate-500 mt-2">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span className="capitalize">{job.employmentType}</span>
                  </div>
                </div>
                <button className="px-5 py-2 bg-brand-50 text-brand-700 font-semibold rounded-lg group-hover:bg-brand-600 group-hover:text-white transition">
                  View Role
                </button>
              </Link>
            ))}
            {jobs.length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border">
                No open positions found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
