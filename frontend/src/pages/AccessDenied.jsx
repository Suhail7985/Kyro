import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function AccessDenied() {
  return (
    <Layout title="Access Denied">
      <div className="card p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-700">
          <span className="text-4xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">You do not have access</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your account does not have permission to view this page. If you think this is an error,
          please contact your administrator.
        </p>
        <Link to="/" className="btn btn-secondary px-6 py-3">
          Return Home
        </Link>
      </div>
    </Layout>
  );
}
