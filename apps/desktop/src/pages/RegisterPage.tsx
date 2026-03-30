import { Navigate } from 'react-router-dom';

/**
 * Registration is handled on the main sign-in screen (tab toggle).
 * This route keeps old links working.
 */
export default function RegisterPage() {
  return <Navigate to="/login?tab=create" replace />;
}
