import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Automatically redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we set things up.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-milma-teal/10 to-milma-blue/10 p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-milma-blue mb-4">MainTMan</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your maintenance operations with our comprehensive management platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>Create and manage maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Easily create, assign, and track maintenance tasks across your organization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Tracking</CardTitle>
              <CardDescription>Monitor task progress in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Keep track of task statuses with a comprehensive history of all changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority System</CardTitle>
              <CardDescription>Focus on what matters most</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Prioritize tasks based on urgency and importance to optimize your workflow.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={handleGetStarted} 
            size="lg" 
            className="bg-milma-blue hover:bg-milma-blue/90 text-white px-8 py-6 text-lg"
          >
            Get Started
          </Button>
          {!user && (
            <p className="mt-4 text-gray-600">
              Already have an account? Sign in to access your dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
