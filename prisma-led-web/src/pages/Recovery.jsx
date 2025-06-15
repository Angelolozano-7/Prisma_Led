import { Link } from 'react-router-dom';

export default function Recovery() {
  return (
    <div className="bg-white p-6 rounded shadow-md w-full max-w-sm mx-auto " >
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="Value"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex gap-4">
          <Link
            to="/auth/login"
            className="w-1/2 text-center text-black py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="w-1/2 bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Reset Password
          </button>
        </div>
      </form>
    </div>
  );
}
