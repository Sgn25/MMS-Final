import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StatusBar as RNStatusBar } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { StatusBar } from "expo-status-bar";

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
                name: profileData.name || user.user_metadata?.name || 'Staff Member',
                designation: profileData.designation || 'Maintenance Team',
                unit_id: profileData.unit_id,
                unit_name: (profileData.units as any)?.name || 'Central Dairy'
            };
            setUserProfile(profile);

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

    const StatusBadge = ({ status }: { status: string }) => {
        const getStyles = () => {
            switch (status) {
                case 'Completed': return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
                case 'In Progress': return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
                default: return { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500' };
            }
        };
        const styles = getStyles();
        return (
            <View className={`${styles.bg} px-3 py-1 rounded-full flex-row items-center`}>
                <View className={`w-1.5 h-1.5 rounded-full ${styles.dot} mr-2`} />
                <Text className={`${styles.text} text-[10px] font-black tracking-wider uppercase`}>{status}</Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-4 text-slate-500 font-medium">Syncing your dashboard...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            {/* Header Section */}
            <View className="bg-white px-6 pt-6 pb-8 rounded-b-[40px] shadow-xl shadow-slate-100 border-b border-slate-100">
                <View className="flex-row justify-between items-center mb-6">
                    <View className="w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center">
                        <Text className="text-white text-xl font-black">M</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center"
                    >
                        <Text className="text-slate-600 font-bold">✕</Text>
                    </TouchableOpacity>
                </View>

                <View>
                    <Text className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-1">Welcome back,</Text>
                    <Text className="text-3xl font-black text-slate-900 leading-none mb-2">{userProfile?.name}</Text>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                        <Text className="text-slate-500 font-bold text-sm">{userProfile?.designation}</Text>
                    </View>
                </View>
            </View>

            {/* Overview Card */}
            <View className="px-6 -mt-6">
                <View className="bg-blue-600 p-6 rounded-3xl shadow-2xl shadow-blue-200">
                    <Text className="text-blue-100 font-bold text-xs tracking-widest uppercase mb-2">Active Unit</Text>
                    <Text className="text-white text-2xl font-black mb-1">{userProfile?.unit_name}</Text>
                    <Text className="text-blue-100/80 font-medium text-sm">Stationed dairy monitoring active</Text>
                </View>
            </View>

            {/* Task Section Header */}
            <View className="px-6 mt-8 mb-4 flex-row justify-between items-end">
                <View>
                    <Text className="text-slate-900 text-xl font-black">Current Tasks</Text>
                    <Text className="text-slate-400 font-bold text-sm">{tasks.length} active maintenance logs</Text>
                </View>
                <TouchableOpacity className="pb-1">
                    <Text className="text-blue-600 font-bold text-sm">View All</Text>
                </TouchableOpacity>
            </View>

            {/* Task List */}
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                }
                ListEmptyComponent={
                    <View className="items-center justify-center pt-20">
                        <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                            <Text className="text-3xl">📋</Text>
                        </View>
                        <Text className="text-slate-400 font-bold text-center">No tasks assigned to your unit yet</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className="bg-white p-6 rounded-[32px] mb-4 shadow-sm border border-slate-100"
                    >
                        <View className="flex-row justify-between items-start mb-3">
                            <View className="flex-1 mr-4">
                                <Text className="text-lg font-black text-slate-900 leading-tight mb-1">{item.title}</Text>
                                <StatusBadge status={item.status} />
                            </View>
                            <View className="bg-slate-50 px-3 py-1 rounded-lg">
                                <Text className="text-slate-400 text-[10px] font-black uppercase">{item.priority}</Text>
                            </View>
                        </View>

                        <Text className="text-slate-500 font-medium text-sm leading-5 mb-5" numberOfLines={2}>
                            {item.description || 'No maintenance details provided for this entry.'}
                        </Text>

                        <View className="flex-row items-center justify-between border-t border-slate-50 pt-4">
                            <View className="flex-row items-center">
                                <View className="w-6 h-6 bg-slate-200 rounded-full items-center justify-center mr-2">
                                    <Text className="text-[10px] font-black text-slate-500">{item.assigned_to?.[0]?.toUpperCase() || '?'}</Text>
                                </View>
                                <Text className="text-xs font-bold text-slate-800">{item.assigned_to || 'Unassigned'}</Text>
                            </View>
                            <Text className="text-[10px] font-bold text-slate-300">
                                {new Date(item.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}
