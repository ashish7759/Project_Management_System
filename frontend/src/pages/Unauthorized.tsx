import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="rounded-full bg-red-100 p-4 text-red-650 shadow-inner">
        <ShieldAlert className="h-16 w-16" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-slate-900 sm:text-4xl">
        Access Denied (403)
      </h1>
      <p className="mt-4 max-w-md text-slate-500">
        You do not have the required administrative permissions to access this screen. 
        Please contact your Jharkhand Bijli IT administrator if you believe this is an error.
      </p>
      <div className="mt-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-600 transition-all duration-150"
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
