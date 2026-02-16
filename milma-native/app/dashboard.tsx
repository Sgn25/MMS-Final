import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assigned_to: string;
    created_at: string;
}

interface UserProfile {
    name: string;
    designation: string;
    unit_id: string;
    unit_name: string;
}

export default function Dashboard() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    const fetchProfileAndTasks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/");
                return;
            }

            // Fetch profile with unit name
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    name, 
                    designation, 
                    unit_id,
                    units (name)
                `)
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            const profile: UserProfile = {
                name: profileData.name || user.user_metadata?.name || 'User',
                designation: profileData.designation || 'Staff',
                unit_id: profileData.unit_id,
                unit_name: (profileData.units as any)?.name || 'Unknown Unit'
            };
            setUserProfile(profile);

            // Fetch tasks for this unit
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('unit_id', profile.unit_id)
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;
            setTasks(tasksData || []);

        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProfileAndTasks();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => fetchProfileAndTasks()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchProfileAndTasks();
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace("/");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'text-green-600';
            case 'In Progress': return 'text-orange-600';
            default: return 'text-blue-600';
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-4 text-gray-600">Loading Dashboard...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-gray-100">
                <View className="flex-row justify-between items-start">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
                        <Text className="text-gray-500 font-medium">{userProfile?.unit_name}</Text>
                    </View>
                    <TouchableOpacity
                        className="bg-red-50 px-4 py-2 rounded-lg"
                        onPress={handleSignOut}
                    >
                        <Text className="text-red-600 font-semibold">Sign Out</Text>
                    </TouchableOpacity>
                </View>
                <View className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <Text className="text-blue-900 font-bold">{userProfile?.name}</Text>
                    <Text className="text-blue-700 text-sm">{userProfile?.designation}</Text>
                </View>
            </View>

            {/* Task List */}
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View className="items-center justify-center pt-20">
                        <Text className="text-gray-400">No tasks found for your unit</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-lg font-bold text-gray-900 flex-1">{item.title}</Text>
                            <View className="bg-gray-50 px-2 py-1 rounded">
                                <Text className={`text-xs font-bold ${getStatusColor(item.status)}`}>
                                    {item.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-gray-600 mb-4" numberOfLines={2}>
                            {item.description || 'No description provided'}
                        </Text>
                        <View className="flex-row justify-between items-center pt-2 border-t border-gray-50">
                            <View className="flex-row items-center">
                                <Text className="text-xs text-gray-400">Assigned to: </Text>
                                <Text className="text-xs font-medium text-gray-700">{item.assigned_to}</Text>
                            </View>
                            <View className="bg-gray-50 px-2 py-1 rounded">
                                <Text className="text-xs text-gray-500">{item.priority}</Text>
                            </View>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}
