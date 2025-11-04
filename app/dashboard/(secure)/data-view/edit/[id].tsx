import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

// Stable Hooks and Data
import { PopulationRecord } from "@/constants/data";
import { usePopulationMutations } from "@/hooks/useFirestoreMutations"; // Stable Mutation
import { usePopulationRecordListener } from "@/hooks/usePopulationRecordListener"; // Stable Read
import { useToastService } from "@/hooks/useToastService";

// Assuming you have a standard button component
// import FormButton from "@/components/ui/FormButton";
// Assuming a Date Picker component that handles the Date object state
// import DatePickerComponent from "@/components/forms/DatePickerComponent";

// --- Main Component ---

export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToastService();

  // 1. Stable Data Reading
  const { record, loading, error } = usePopulationRecordListener(id || null);

  // 2. Stable Mutation Access
  const { updateRecord } = usePopulationMutations();

  // 3. Form State (Using partial structure for updates)
  const [formData, setFormData] = useState<Partial<PopulationRecord>>({});
  const [saving, setSaving] = useState(false);

  // State to track if the form has been initialized once
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Effect 1: Initialize Form Data ---
  useEffect(() => {
    // Run ONLY when a stable 'record' loads successfully and hasn't initialized yet
    if (record && !isInitialized) {
      setFormData({
        houseId: record.houseId,
        street: record.street,
        name: record.name,
        houseStatus: record.houseStatus,
        gender: record.gender,
        adultTotal: record.adultTotal,
        kidsTotal: record.kidsTotal,
        domicile: record.domicile,
        // dateOccupied is a Date object from the listener mapper
        dateOccupied: record.dateOccupied,
      });
      setIsInitialized(true);
    }
  }, [record, isInitialized]);
  // This stable dependency array ensures initialization happens exactly once per ID.

  // --- Effect 2: Handle Errors (e.g., Record Not Found) ---
  useEffect(() => {
    if (!loading && error && error.message === "Record not found") {
      showErrorToast("Not Found", `Record with ID ${id} not found.`);
      router.back();
    }
  }, [loading, error, id]);

  // 4. Input Handler
  const handleChange = (key: keyof PopulationRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // 5. Submission Logic
  const handleUpdate = async () => {
    if (!id || saving || !record) return;

    setSaving(true);
    Keyboard.dismiss();

    // Basic validation check
    if (!formData.houseId || !formData.name || !formData.houseStatus) {
      showErrorToast("Error", "Please fill in all required fields.");
      setSaving(false);
      return;
    }

    try {
      // Send only the changed fields in formData to the stable mutation hook
      await updateRecord(id, formData);
      showSuccessToast(
        "Success",
        `Record for ${formData.houseId} updated successfully.`
      );
      router.replace(`/dashboard/(secure)/data-view/data/${id}`); // Go back to detail view
    } catch (err) {
      console.error("Update error:", err);
      showErrorToast("Update Failed", "Could not save changes. Check network.");
    } finally {
      setSaving(false);
    }
  };

  // --- Loading/Error UI ---
  if (loading || !id || !isInitialized) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Loading form data...</Text>
      </View>
    );
  }
  if (error || !record) {
    // This handles cases where the listener failed or record was deleted
    return null;
  }

  // --- Render Form ---
  return (
    <ScrollView className="flex-1 p-6 bg-white">
      {/* Commented out Stack.Screen title override as per your UI requirement */}
      <Stack.Screen
        options={{
          title: `${record.name} - ${record.houseId} di Jl. ${record.street}`,
          headerTitleStyle: { fontSize: 16 },
        }}
      />

      <Text className="text-2xl font-bold mb-6 text-gray-800">
        Ubah Data Hunian {record.houseId}
      </Text>

      {/* Input: House ID */}
      {/* <View className="mb-4">
        <Text className="text-sm font-medium mb-1 text-gray-700">House ID</Text>
        <TextInput
          value={formData.houseId || ""}
          onChangeText={(val) => handleChange("houseId", val)}
          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500"
          editable={!saving}
        />
      </View> */}

      {/* Input: Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1 text-gray-700">
          Nama Lengkap
        </Text>
        <TextInput
          value={formData.name || ""}
          onChangeText={(val) => handleChange("name", val)}
          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500"
          editable={!saving}
        />
      </View>

      {/* Input: House Status (Use Picker/Dropdown here) */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1 text-gray-700">
          Status Hunian
        </Text>
        {/* Replace with a standard Picker/Dropdown component */}
        {/* <TextInput
          value={formData.houseStatus || ""}
          onChangeText={(val) => handleChange("houseStatus", val)}
          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500"
          editable={!saving}
        /> */}
        <View className="flex-row justify-between mb-4">
          {["Kosong", "Ditempati", "Sewa"].map((status) => (
            <Pressable
              key={status}
              onPress={() => handleChange("houseStatus", status)}
              className={`p-3 rounded-lg border flex-1 items-center mx-1 
            ${formData.houseStatus === status ? "bg-indigo-500 border-indigo-700" : "bg-white border-gray-300"}`}
            >
              <Text
                className={`font-semibold ${formData.houseStatus === status ? "text-white" : "text-gray-700"}`}
              >
                {status}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Input: Date Occupied (Requires a DatePicker) */}
      {/* <View className="mb-6">
                 <Text className="text-sm font-medium mb-1 text-gray-700">Date Occupied</Text>
                 <DatePickerComponent 
                    date={formData.dateOccupied}
                    onChange={(date) => handleChange('dateOccupied', date)}
                 />
            </View>
            */}

      {/* Save Button */}
      <Pressable
        onPress={handleUpdate}
        className="mt-4 bg-indigo-600 p-3 rounded-lg shadow-md"
        disabled={saving}
      >
        <Text className="text-white text-center font-bold text-lg">
          {saving ? "Menyimpan..." : "Simpan Data"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
