import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";

export default function Dashboard() {
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace("/");
    };

    return (
        <View className="flex-1 justify-center items-center bg-white">
            <Text className="text-2xl font-bold mb-4">Welcome to Dashboard</Text>
            <TouchableOpacity
                className="bg-red-500 px-6 py-3 rounded-lg"
                onPress={handleSignOut}
            >
                <Text className="text-white font-semibold">Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}
