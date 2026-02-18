import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
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
            Alert.alert("Missing Information", "Please enter your email and password.");
            return;
        }
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error: any) {
            Alert.alert("Login Failed", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!email || !password || !name || !unitId || !designation) {
            Alert.alert("Missing Fields", "Please complete all fields and select your unit.");
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
            Alert.alert("Inquiry Sent", "Please check your email to verify your account.");
        } catch (error: any) {
            Alert.alert("Signup Failed", error.message);
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
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    <View className="px-6 pt-16 pb-12">
                        {/* Logo & Header */}
                        <View className="items-center mb-12">
                            <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center shadow-lg shadow-blue-200 mb-6">
                                <Text className="text-white text-4xl font-black">M</Text>
                            </View>
                            <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">MainTMan</Text>
                            <Text className="text-slate-500 mt-2 text-center text-base leading-6 font-medium">
                                Maintenance Management System for multi-unit milk production
                            </Text>
                        </View>

                        {/* Mode Toggle */}
                        <View className="flex-row bg-slate-100 p-1.5 rounded-2xl mb-8">
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-xl items-center ${mode === "signin" ? "bg-white shadow-sm" : ""}`}
                                onPress={() => setMode("signin")}
                            >
                                <Text className={`font-bold text-sm ${mode === "signin" ? "text-slate-900" : "text-slate-500"}`}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-xl items-center ${mode === "signup" ? "bg-white shadow-sm" : ""}`}
                                onPress={() => setMode("signup")}
                            >
                                <Text className={`font-bold text-sm ${mode === "signup" ? "text-slate-900" : "text-slate-500"}`}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View className="space-y-5">
                            {mode === "signup" && (
                                <>
                                    <View>
                                        <Text className="text-sm font-bold text-slate-700 ml-1 mb-2">Full Name</Text>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-medium"
                                            placeholder="Enter your name"
                                            placeholderTextColor="#94a3b8"
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-bold text-slate-700 ml-1 mb-2">Designation</Text>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-medium"
                                            placeholder="e.g. Mechanical Engineer"
                                            placeholderTextColor="#94a3b8"
                                            value={designation}
                                            onChangeText={setDesignation}
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-bold text-slate-700 ml-1 mb-2">Dairy Unit</Text>
                                        <TouchableOpacity
                                            className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 flex-row justify-between items-center"
                                            onPress={() => setIsUnitModalVisible(true)}
                                            activeOpacity={0.7}
                                        >
                                            <Text className={unitName ? "text-slate-900 font-medium" : "text-slate-400 font-medium"}>
                                                {unitName || "Select your unit"}
                                            </Text>
                                            <Text className="text-slate-400">⌵</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            <View>
                                <Text className="text-sm font-bold text-slate-700 ml-1 mb-2">Email Address</Text>
                                <TextInput
                                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-medium"
                                    placeholder="you@email.com"
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-bold text-slate-700 ml-1 mb-2">Password</Text>
                                <TextInput
                                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 font-medium"
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                className={`w-full bg-blue-600 rounded-2xl py-4 mt-4 shadow-md shadow-blue-200 flex-row justify-center items-center ${isLoading ? "opacity-90" : ""}`}
                                onPress={mode === "signin" ? handleSignIn : handleSignUp}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-extrabold text-lg">
                                        {mode === "signin" ? "Sign In" : "Create Account"}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {mode === "signin" && (
                                <TouchableOpacity className="mt-4 items-center">
                                    <Text className="text-blue-600 font-bold">Forgot Password?</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Unit Selection Modal */}
                <Modal
                    visible={isUnitModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsUnitModalVisible(false)}
                >
                    <View className="flex-1 justify-center bg-black/60 px-6">
                        <View className="bg-white rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[70%]">
                            <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <Text className="text-xl font-black text-slate-900">Choose Dairy Unit</Text>
                                <TouchableOpacity onPress={() => setIsUnitModalVisible(false)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                                    <Text className="text-blue-600 font-bold text-base">Close</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={units}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        className="py-5 px-2 active:bg-slate-50 rounded-xl"
                                        onPress={() => selectUnit(item.id, item.name)}
                                    >
                                        <Text className="text-lg text-slate-800 font-semibold">{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
