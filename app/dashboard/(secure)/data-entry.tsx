// app/dashboard/(secure)/data-entry.tsx
import AppButton from "@/components/ui/AppButton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FormInput from "@/components/ui/FormInput";
import SelectGroup from "@/components/ui/SelectGroup";
import { PopulationRecord, STREET_OPTIONS } from "@/constants/data";
import { usePopulationMutations } from "@/hooks/useFirestoreMutations";
import { useToastService } from "@/hooks/useToastService";
import { checkHouseIdExists } from "@/utils/populationService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

// Define the initial state structure for the form (excluding id, entryDate)
const initialFormState: Omit<
  PopulationRecord,
  "id" | "entryDate" | "dateOccupied"
> & { dateOccupied?: Date | string; housePrefix: string; houseSuffix: string } =
  {
    name: "",
    gender: "Pria", // Default to Male
    housePrefix: "",
    houseSuffix: "",
    street: STREET_OPTIONS[0],
    domicile: "Gunung Sari", // Default to Gunung Sari
    houseStatus: "Ditempati", // Default to Ditempati
    kidsTotal: 0,
    adultTotal: 0, // Default to 1 adult if Ditempati
    dateOccupied: undefined, // Will be set only if status is Ditempati/Sewa
  };
const INITIAL_ERRORS = {
  name: null,
  gender: null,
  housePrefix: "",
  houseSuffix: "",
  street: null,
  domicile: null,
  houseStatus: null,
  dateOccupied: null,
};

export default function DataEntryScreen() {
  const router = useRouter();
  const { addRecord } = usePopulationMutations();
  const { showSuccessToast, showErrorToast } = useToastService();
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors(INITIAL_ERRORS);
    router.back();
    console.log("Form Resetted !");
  };

  const handleChange = (key: keyof typeof initialFormState, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const housePrefix = formData.housePrefix.toUpperCase().trim();
    const houseSuffix = String(formData.houseSuffix).trim();

    // Simple Validation
    if (!housePrefix || !houseSuffix || !formData.street || !formData.name) {
      showErrorToast(
        "Validation Failed",
        "Please fill in Name, House ID, and Street."
      );
      return;
    }

    const combinedHouseId = `${housePrefix}/${houseSuffix}`;

    setLoading(true);

    try {
      const exists = await checkHouseIdExists(combinedHouseId);
      if (exists) {
        showErrorToast(
          "Sudah Terdata!",
          `Rumah ${combinedHouseId} sudah terdata di sistem. Mohon cek kembali.`
        );
        setLoading(false);
        return;
      }
    } catch (error: any) {
      showErrorToast(
        "Database Error: ",
        error.message || "Gagal menghubungi database server!"
      );
      setLoading(false);
      return;
    }

    try {
      // Prepare the payload for the hook
      const payload: Omit<PopulationRecord, "id" | "entryDate"> = {
        name: formData.name,
        street: formData.street,
        gender: formData.gender,
        houseStatus: formData.houseStatus,
        domicile: formData.domicile,
        adultTotal: formData.adultTotal,
        kidsTotal: formData.kidsTotal,
        houseId: combinedHouseId,
        dateOccupied:
          formData.dateOccupied instanceof Date
            ? formData.dateOccupied
            : undefined,

        // ...formData,
        // // Ensure dateOccupied is a Date object if present, otherwise omit it from the payload type
        // kidsTotal: Number(formData.kidsTotal || 0),
        // adultTotal: Number(formData.adultTotal || 0),
      };

      await addRecord(payload);

      showSuccessToast(
        "Success!",
        `Record for House ID ${combinedHouseId} has been saved.`
      );

      // Reset form or navigate away
      setFormData(initialFormState);
      router.replace("/dashboard/(secure)/data-view"); // Option to go to the list page
    } catch (error: any) {
      console.error("Save Error:", error);
      showErrorToast(
        "Save Failed",
        "Could not save record to Firestore. Check console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper for Date input (we'll simplify this for now without a date picker)
  const DatePlaceholder = () => (
    <Text className="text-gray-500 italic mt-2 text-sm">
      Pilih tanggal sesuai perkiraan penghuni masuk atau tinggal didalam hunian.
    </Text>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Configure Stack Header for this specific screen group */}
      {/* <Stack.Screen options={{ title: "New Population Data Entry" }} /> */}

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold">Form Pendataan Warga</Text>
        <Text className="text-xs mb-2 pb-2 border-b-2 border-gray-200">
          Mohon isi data sebenar-benarnya dengan lengkap dan akurat.
        </Text>

        {/* Name */}
        <FormInput
          label="Nama Penghuni"
          value={formData.name}
          onChangeText={(value) => handleChange("name", value)}
          placeholder="e.g., Budi Santoso"
          keyboardType="default"
          // Pass the error string from your validation state
        />

        {/* House Status Selector */}
        <Text className="font-semibold text-gray-700 mt-4 mb-1">
          Status Hunian
        </Text>
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

        {/* House ID & Street */}
        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row justify-start gap-2">
              <View className="w-1/3">
                <Text className="font-semibold text-gray-700 mt-2 mb-1">
                  Blok
                </Text>
                <TextInput
                  placeholder="C28"
                  value={formData.housePrefix}
                  onChangeText={(text) =>
                    handleChange("housePrefix", text.toUpperCase())
                  }
                  className="border p-3 rounded-lg border-gray-300"
                  autoCapitalize="characters"
                />
              </View>
              <View className="w-1/3">
                <Text className="font-semibold text-gray-700 mt-2 mb-1">
                  Nomor
                </Text>
                <TextInput
                  placeholder="19"
                  value={formData.houseSuffix}
                  onChangeText={(text) => handleChange("houseSuffix", text)}
                  keyboardType="decimal-pad"
                  maxLength={3}
                  className="border p-3 rounded-lg border-gray-300"
                />
              </View>
            </View>
          </View>
          {/* Street Pick */}
          <View className="flex-1">
            <SelectGroup
              label="Jalan (Gang)"
              options={STREET_OPTIONS}
              selectedValue={formData.street}
              onValueChange={(value) => handleChange("street", value)}
              horizontal={true} // Horizontal layout is good for forms
              className="mt-2"
            />
          </View>
          {/* </View> */}
        </View>

        {/* Gender Selector (Only for Ditempati/Sewa) */}
        {(formData.houseStatus === "Ditempati" ||
          formData.houseStatus === "Sewa") && (
          <>
            <Text className="font-semibold text-gray-700 mt-4 mb-1">
              Jenis Kelamin Penghuni
            </Text>
            <View className="flex-row justify-between gap-4 mb-4">
              {["Pria", "Wanita"].map((gender) => (
                <Pressable
                  key={gender}
                  onPress={() => handleChange("gender", gender)}
                  className={`flex-1 p-3 rounded-lg border items-center
                              ${formData.gender === gender ? "bg-indigo-500 border-indigo-700" : "bg-white border-gray-300"}`}
                >
                  <Text
                    className={`font-semibold ${formData.gender === gender ? "text-white" : "text-gray-700"}`}
                  >
                    {gender}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Totals */}
            <Text className="text-center mt-3 font-semibold border-b-2 border-gray-200 pb-2">
              Total Penghuni Rumah
            </Text>
            <View className="flex-row justify-between gap-3 mt-2">
              <View className="flex-1">
                <FormInput
                  label="Dewasa"
                  value={formData.adultTotal}
                  onChangeText={(value) => handleChange("adultTotal", value)}
                  placeholder="0"
                  keyboardType="default"
                  labelStyle="text-center"
                  // Pass the error string from your validation state
                />
              </View>
              <View className="flex-1">
                <FormInput
                  label="Anak-anak"
                  value={formData.kidsTotal}
                  onChangeText={(value) => handleChange("kidsTotal", value)}
                  placeholder="0"
                  keyboardType="default"
                  labelStyle="text-center"
                  // Pass the error string from your validation state
                />
              </View>
            </View>
          </>
        )}

        {/* Date Occupied Input (Optional, requires conversion) */}
        <DatePickerInput
          label="Tanggal Hunian Ditempati"
          value={formData.dateOccupied}
          onChange={(date) => handleChange("dateOccupied", date)}
          className="mb-0"
        />
        <DatePlaceholder />

        {/* Domicile Selector */}
        <Text className="font-semibold text-gray-700 mt-4 mb-1">
          Domisili KTP
        </Text>
        <View className="flex-row justify-start mb-4">
          {["Gunung Sari", "Lainnya"].map((domicileStatus) => (
            <Pressable
              key={domicileStatus}
              onPress={() => handleChange("domicile", domicileStatus)}
              className={`p-3 rounded-lg border w-36 items-center mr-3
                      ${formData.domicile === domicileStatus ? "bg-indigo-500 border-indigo-700" : "bg-white border-gray-300"}`}
            >
              <Text
                className={`font-semibold ${formData.domicile === domicileStatus ? "text-white" : "text-gray-700"}`}
              >
                {domicileStatus}
              </Text>
            </Pressable>
          ))}
        </View>
        <AppButton
          onPress={handleSave}
          title="Simpan Data"
          loadingText="Menyimpan..."
          variant="primary"
        />
        <AppButton
          onPress={handleReset}
          title="Batal"
          variant="danger"
          className="mt-3"
        />

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
