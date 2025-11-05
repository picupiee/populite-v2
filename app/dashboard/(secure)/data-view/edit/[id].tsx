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
import AppButton from "@/components/ui/AppButton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FormInput from "@/components/ui/FormInput";
import { PopulationRecord, STREET_OPTIONS } from "@/constants/data";
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
      {/* Street Selector */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1 text-gray-700">
          Jalan (Gang)
        </Text>
        <View className="flex-row flex-wrap justify-between gap-2">
          {STREET_OPTIONS.map((streetOption) => (
            <Pressable
              key={streetOption}
              onPress={() => handleChange("street", streetOption)}
              className={`p-2 rounded-lg border flex-grow items-center ${formData.street === streetOption ? "bg-green-500 border-green-700" : "bg-white border-gray-300"}`}
              disabled={saving}
            >
              <Text
                className={`font-semibold text-sm ${formData.street === streetOption ? "text-white" : "text-gray-700"}`}
              >
                {streetOption}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {/* Update Adult / Kids Total */}
      <Text className="text-center font-medium mt-2 border-t-2 border-gray-200 pt-2">
        Perbaharui Jumlah Penghuni
      </Text>
      <View className="flex-row justify-between gap-3 mt-2">
        <View className="flex-1">
          <FormInput
            label="Dewasa"
            value={formData.adultTotal}
            onChangeText={(value) => handleChange("adultTotal", value)}
            placeholder="0"
            keyboardType="decimal-pad"
            labelStyle="text-center"
          />
        </View>
        <View className="flex-1">
          <FormInput
            label="Anak-Anak"
            value={formData.kidsTotal}
            onChangeText={(value) => handleChange("kidsTotal", value)}
            placeholder="0"
            keyboardType="decimal-pad"
            labelStyle="text-center"
          />
        </View>
      </View>
      {/* Change Date of Occupy */}
      <View className="mb-4">
        <DatePickerInput
          label="Tanggal Dihuni (Date Occupied)"
          value={formData.dateOccupied} // Must be a Date object or undefined
          onChange={(date) => handleChange("dateOccupied", date)}
        />
      </View>

      {/* Save Button */}
      <AppButton
        onPress={handleUpdate}
        title="Simpan Data"
        loadingText="Menyimpan..."
        variant="primary"
      />
      <AppButton
        onPress={() => router.back()}
        title="Batal"
        variant="danger"
        className="mt-3"
      />
    </ScrollView>
  );
}
