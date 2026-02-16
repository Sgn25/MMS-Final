import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList, ScrollView } from "react-native";
import { supabase } from "../src/lib/supabase";
import { useRouter } from "expo-router";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [designation, setDesignation] = useState("");
    const [unitId, setUnitId] = useState("");
    const [unitName, setUnitName] = useState("");
    const [units, setUnits] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUnits = async () => {
            const { data, error } = await supabase.from('units').select('id, name');
            if (error) {
                console.error('Error fetching units:', error);
            } else {
                setUnits(data || []);
            }
        };
        fetchUnits();
    }, []);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            Alert.alert("Success", "Logged in successfully!");
            // The Auth state change listener in _layout or elsewhere should handle navigation
        } catch (error: any) {
            Alert.alert("Login Error", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!email || !password || !name || !unitId || !designation) {
            Alert.alert("Error", "Please fill in all fields and select a unit");
            return;
        }
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        unit_id: unitId,
                        designation: designation,
                    },
                },
            });
            if (error) throw error;
            Alert.alert("Success", "Check your email for the confirmation link!");
        } catch (error: any) {
            Alert.alert("Signup Error", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const selectUnit = (id: string, name: string) => {
        setUnitId(id);
        setUnitName(name);
        setIsUnitModalVisible(false);
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="flex-1 justify-center items-center bg-gray-50 px-4 py-8">
                <View className="w-full max-w-sm">
                    <View className="items-center mb-8">
                        <Text className="text-3xl font-bold text-blue-600">MainTMan</Text>
                        <Text className="text-gray-600 mt-2 text-center">Maintenance Management System (Multi-Unit)</Text>
                    </View>

                    <View className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <View className="flex-row mb-6 border-b border-gray-200">
                            <TouchableOpacity
                                className={`flex-1 pb-3 ${mode === "signin" ? "border-b-2 border-blue-600" : ""}`}
                                onPress={() => setMode("signin")}
                            >
                                <Text className={`text-center font-medium ${mode === "signin" ? "text-blue-600" : "text-gray-500"}`}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 pb-3 ${mode === "signup" ? "border-b-2 border-blue-600" : ""}`}
                                onPress={() => setMode("signup")}
                            >
                                <Text className={`text-center font-medium ${mode === "signup" ? "text-blue-600" : "text-gray-500"}`}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {mode === "signup" && (
                            <>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
                                    <TextInput
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                                        placeholder="John Doe"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                    />
                                </View>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Designation</Text>
                                    <TextInput
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                                        placeholder="Maintenance Engineer"
                                        value={designation}
                                        onChangeText={setDesignation}
                                    />
                                </View>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Dairy Unit</Text>
                                    <TouchableOpacity
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 flex-row justify-between items-center"
                                        onPress={() => setIsUnitModalVisible(true)}
                                    >
                                        <Text className={unitName ? "text-gray-900" : "text-gray-400"}>
                                            {unitName || "Select your unit"}
                                        </Text>
                                        <Text className="text-gray-400">▼</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                            <TextInput
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                                placeholder="you@example.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                            <TextInput
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            className="w-full bg-blue-600 rounded-lg py-3 flex-row justify-center items-center"
                            onPress={mode === "signin" ? handleSignIn : handleSignUp}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-semibold text-base">
                                    {mode === "signin" ? "Sign In" : "Sign Up"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Unit Selection Modal */}
                <Modal
                    visible={isUnitModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsUnitModalVisible(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl p-6 h-2/3">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-gray-900">Select Dairy Unit</Text>
                                <TouchableOpacity onPress={() => setIsUnitModalVisible(false)}>
                                    <Text className="text-blue-600 font-semibold">Close</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={units}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        className="py-4 border-b border-gray-100"
                                        onPress={() => selectUnit(item.id, item.name)}
                                    >
                                        <Text className="text-lg text-gray-800">{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </View>
        </ScrollView>
    );
}
