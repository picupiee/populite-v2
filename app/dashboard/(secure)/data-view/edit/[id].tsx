import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  View,
} from "react-native";

// Stable Hooks and Data
import AppButton from "@/components/ui/AppButton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FormInput from "@/components/ui/FormInput";
import SelectGroup from "@/components/ui/SelectGroup";
import {
  GENDER_OPTIONS,
  PopulationRecord,
  STREET_OPTIONS,
} from "@/constants/data";
import { useActivityLog } from "@/hooks/useActivityLog";
import { usePopulationMutations } from "@/hooks/useFirestoreMutations"; // Stable Mutation
import { usePopulationRecordListener } from "@/hooks/usePopulationRecordListener"; // Stable Read
import { useToastService } from "@/hooks/useToastService";

// --- Main Component ---

export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToastService();

  // 1. Stable Data Reading
  const { record, loading, error } = usePopulationRecordListener(id || null);

  // 2. Stable Mutation Access
  const { updateRecord } = usePopulationMutations();
  const { logActivity } = useActivityLog();

  // 3. Form State (Using partial structure for updates)
  const [formData, setFormData] = useState<Partial<PopulationRecord>>({});
  const [saving, setSaving] = useState(false);

  // State to track the ID of the currently initialized record
  const [initializedId, setInitializedId] = useState<string | null>(null);

  // --- Effect 1: Initialize Form Data ---
  useEffect(() => {
    // Run ONLY when a stable 'record' loads successfully and matches the current ID,
    // AND we haven't initialized this specific ID yet.
    if (record && record.id === id && initializedId !== id) {
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
      setInitializedId(id);
    }
  }, [record, id, initializedId]);
  // This ensures initialization happens exactly once per new ID.

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

      await logActivity(
        "UPDATE",
        "RECORD",
        `Updated record: ${record.houseId} - ${record.name}`,
        id,
        {
          before: record,
          after: { ...record, ...formData },
          changes: formData,
        }
      );

      showSuccessToast(
        "Success",
        `Record for ${formData.houseId || record.houseId} updated successfully.`
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
  if (loading || !id || initializedId !== id) {
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
        <FormInput
          label="Nama Lengkap"
          value={formData.name || ""}
          onChangeText={(val) => handleChange("name", val)}
        />
        <SelectGroup
          label="Jenis Kelamin"
          options={GENDER_OPTIONS}
          selectedValue={formData.gender || ""}
          onValueChange={(val) => handleChange("gender", val)}
        />
      </View>
      {/* Input: House Status (Use Picker/Dropdown here) */}
      <SelectGroup
        label="Status Hunian"
        options={["Kosong", "Ditempati", "Sewa"]} // Ensure this list is complete
        selectedValue={formData.houseStatus || ""}
        onValueChange={(value) => handleChange("houseStatus", value)}
        horizontal={true} // Use vertical alignment if it's 3 items wide
      // Need to provide the SelectGroup component colors for 'Kosong', 'Ditempati', 'Sewa'
      />
      {/* Street Selector */}
      <SelectGroup
        label="Jalan (Gang)"
        options={STREET_OPTIONS}
        selectedValue={formData.street || ""}
        onValueChange={(value) => handleChange("street", value)}
        horizontal={true}
      />
      {/* Update Adult / Kids Total */}
      <Text className="text-center font-medium mt-2 border-t-2 border-gray-200 pt-2">
        Perbaharui Jumlah Penghuni
      </Text>
      <View className="flex-row justify-between gap-3 mt-2">
        <View className="flex-1">
          <FormInput
            label="Dewasa"
            value={String(formData.adultTotal || "0")}
            onChangeText={(value) => handleChange("adultTotal", Number(value))}
            placeholder="0"
            keyboardType="decimal-pad"
            labelStyle="text-center"
          />
        </View>
        <View className="flex-1">
          <FormInput
            label="Anak-Anak"
            value={String(formData.kidsTotal || "0")}
            onChangeText={(value) => handleChange("kidsTotal", Number(value))}
            placeholder="0"
            keyboardType="decimal-pad"
            labelStyle="text-center"
          />
        </View>
      </View>
      <Text className="text-center font-medium mt-2 border-t-2 border-gray-200 pt-2">
        Jumlah Penghuni
      </Text>
      <Text className="text-xs text-center">(Berdasarkan Jenis Kelamin)</Text>
      <View className="flex-1">
        <View className="flex-row gap-4 mt-2">
          <View className="flex-1">
            <Text className="text-center mb-2">Dewasa</Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <FormInput
                  label="Pria"
                  value={String(formData.adultMale || "0")}
                  onChangeText={(value) => handleChange("adultMale", Number(value))}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  labelStyle="text-center text-xs"
                />
              </View>
              <View className="flex-1">
                <FormInput
                  label="Wanita"
                  value={String(formData.adultFemale || "0")}
                  onChangeText={(value) => handleChange("adultFemale", Number(value))}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  labelStyle="text-center text-xs"
                />
              </View>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-center mb-2">Anak-Anak</Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <FormInput
                  label="Laki-laki"
                  value={String(formData.kidsMale || "0")}
                  onChangeText={(value) => handleChange("kidsMale", Number(value))}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  labelStyle="text-center text-xs"
                />
              </View>
              <View className="flex-1">
                <FormInput
                  label=" Perempuan"
                  value={String(formData.kidsFemale || "0")}
                  onChangeText={(value) => handleChange("kidsFemale", Number(value))}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  labelStyle="text-center text-xs"
                />
              </View>
            </View>
          </View>
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
        onPress={() =>
          router.replace(`/dashboard/(secure)/data-view/data/${id}`)
        }
        title="Batal"
        variant="danger"
        className="mt-3"
      />
    </ScrollView>
  );
}
