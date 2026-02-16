import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase, Building2, Save, LogOut } from 'lucide-react';

const ProfilePage = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [units, setUnits] = useState<{ id: string, name: string }[]>([]);

    const [profile, setProfile] = useState({
        name: '',
        designation: '',
        unitId: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch units
                const { data: unitsData, error: unitsError } = await supabase.from('units').select('id, name');
                if (unitsError) throw unitsError;
                setUnits(unitsData || []);

                // Fetch current profile
                if (user) {
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('name, designation, unit_id')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (profileError) throw profileError;

                    if (profileData) {
                        setProfile({
                            name: profileData.name || '',
                            designation: profileData.designation || '',
                            unitId: profileData.unit_id || ''
                        });
                    }
                }
            } catch (error: any) {
                console.error('Error fetching profile data:', error);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        if (!profile.name || !profile.unitId) {
            toast.error('Name and Unit are required');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: profile.name,
                    designation: profile.designation,
                    unit_id: profile.unitId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profile updated! Signing out to apply changes...');

            // Delay sign out slightly so they see the success message
            setTimeout(async () => {
                await signOut();
                navigate('/login');
            }, 2000);

        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(`Error: ${error.message}`);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="mb-6 flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Button>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-milma-blue/10 p-3 rounded-full">
                                <User className="h-6 w-6 text-milma-blue" />
                            </div>
                            <div>
                                <CardTitle>My Profile</CardTitle>
                                <CardDescription>Manage your account settings and unit selection</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="designation" className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-gray-400" />
                                Designation
                            </Label>
                            <Input
                                id="designation"
                                value={profile.designation}
                                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                                placeholder="Maintenance Manager"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unit" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                Dairy Unit
                            </Label>
                            <Select
                                value={profile.unitId}
                                onValueChange={(value) => setProfile({ ...profile, unitId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your dairy unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                Changing your unit will restrict your view to tasks associated with the new unit.
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                        <Button
                            className="w-full sm:w-auto bg-milma-blue hover:bg-milma-blue/90"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                "Saving..."
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save & Re-login
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => signOut().then(() => navigate('/login'))}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </CardFooter>
                </Card>

                <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                        <strong>Note:</strong> Saving changes will automatically sign you out. You will need to sign back in for the changes to fully take effect across all features, including FCM notifications.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
