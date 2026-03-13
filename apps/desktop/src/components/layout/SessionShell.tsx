import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import SessionSidebar from './SessionSidebar';
import SessionChat from '../session/SessionChat';
import BottomPanel from '../session/BottomPanel';

export default function SessionShell() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopNavBar />
      <div className="flex flex-1 min-h-0">
        <SessionSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 min-h-0">
            <Outlet />
            <SessionChat />
          </div>
          <BottomPanel />
        </div>
      </div>
    </div>
  );
}
