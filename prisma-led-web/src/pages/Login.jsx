import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="bg-white p-6 rounded shadow-md w-full max-w-sm mx-auto">
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Usuario</label>
          <input
            type="text"
            placeholder="Angelo"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            placeholder="123"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          Sign In
        </button>
      </form>

      <div className="mt-4 text-sm text-center">
        <Link to="/auth/recovery" className="text-violeta-oscuro hover:underline block">
          Forgot password?
        </Link>
        <Link to="/perfil/registro" className="text-violeta-oscuro hover:underline block">
          Create account
        </Link>
      </div>
    </div>
  );
}
