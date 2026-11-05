import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';

export const DashboardPage: React.FC = () => {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  const handleSignout = async () => {
    await signout();
    navigate('/signin');
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col">
      {/* Dashboard Topbar */}
      <header className="w-full border-b border-[#E8DFD3] bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight text-[#2B231D]">
            Readventure
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#756F68] hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 w-full flex-1 space-y-6">
        <Card className="bg-[#FFFFFF] border-[#E8DFD3] p-6 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl text-[#2B231D]">
              Welcome back, {user?.name || 'Reader'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#756F68]">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3]">
                <div className="text-xs font-semibold uppercase text-[#996735]">
                  Email Address
                </div>
                <div className="text-[#2B231D] font-medium mt-1">{user?.email}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3]">
                <div className="text-xs font-semibold uppercase text-[#996735]">
                  Member Since
                </div>
                <div className="text-[#2B231D] font-medium mt-1">{formattedDate}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border-[#E8DFD3] p-6 rounded-2xl shadow-sm">
          <h4 className="text-base font-bold text-[#2B231D]">Your Personal Library</h4>
          <p className="text-sm text-[#756F68] mt-1.5 leading-relaxed">
            Your reading library space is ready. Day 3 will introduce full account registration and password recovery.
          </p>
        </Card>
      </main>
    </div>
  );
};
