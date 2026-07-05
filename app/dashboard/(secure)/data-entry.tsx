// app/dashboard/(secure)/data-entry.tsx
import AppButton from "@/components/ui/AppButton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FormInput from "@/components/ui/FormInput";
import SelectGroup from "@/components/ui/SelectGroup";
import { PopulationRecord, STREET_OPTIONS } from "@/constants/data";
import { useActivityLog } from "@/hooks/useActivityLog";
import { usePopulationMutations } from "@/hooks/useFirestoreMutations";
import { useToastService } from "@/hooks/useToastService";
import { checkHouseIdExists } from "@/utils/populationService";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

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
  // To be added soon for more accurate and detailed data per house.
  kidsMale: "" as unknown as number,
  kidsFemale: "" as unknown as number,
  adultMale: "" as unknown as number,
  adultFemale: "" as unknown as number,
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

const DatePlaceholder = () => (
  <Text className="text-gray-400 italic mt-2 text-xs ml-1">
    * Pilih tanggal sesuai perkiraan penghuni masuk.
  </Text>
);

export default function DataEntryScreen() {
  const router = useRouter();
  const { logActivity } = useActivityLog();
  const { addRecord } = usePopulationMutations();
  const { showSuccessToast, showErrorToast } = useToastService();
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFormData(initialFormState);
      setErrors(INITIAL_ERRORS);
      setLoading(false);
    }, [])
  );

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors(INITIAL_ERRORS);
    router.back();
    // console.log("Form Resetted !");
  };

  const handleChange = useCallback(
    (key: keyof typeof initialFormState, value: any) => {
      setFormData((prev) => {
        const newState = { ...prev, [key]: value };

        // Auto-sum adult and kids totals from specific gender and age inputs
        if (key === "adultMale" || key === "adultFemale") {
          newState.adultTotal =
            (parseInt(String(newState.adultMale)) || 0) +
            (parseInt(String(newState.adultFemale)) || 0);
        }
        if (key === "kidsMale" || key === "kidsFemale") {
          newState.kidsTotal =
            (parseInt(String(newState.kidsMale)) || 0) +
            (parseInt(String(newState.kidsFemale)) || 0);
        }

        return newState;
      });
    },
    [],
  );

  const handleSave = async () => {
    const housePrefix = formData.housePrefix.toUpperCase().trim();
    const houseSuffix = String(formData.houseSuffix).trim();

    // Simple Validation
    if (!housePrefix || !houseSuffix || !formData.street || !formData.name) {
      showErrorToast(
        "Validation Failed",
        "Please fill in Name, House ID, and Street.",
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
          `Rumah ${combinedHouseId} sudah terdata di sistem. Mohon cek kembali.`,
        );
        setLoading(false);
        return;
      }
    } catch (error: any) {
      showErrorToast(
        "Database Error: ",
        error.message || "Gagal menghubungi database server!",
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
        housePrefix: housePrefix,
        houseSuffix: houseSuffix,
        kidsMale: parseInt(String(formData.kidsMale)) || 0,
        kidsFemale: parseInt(String(formData.kidsFemale)) || 0,
        adultMale: parseInt(String(formData.adultMale)) || 0,
        adultFemale: parseInt(String(formData.adultFemale)) || 0,
        dateOccupied:
          formData.dateOccupied instanceof Date
            ? formData.dateOccupied
            : (undefined as any),
      };

      const newRecordId = await addRecord(payload);

      await logActivity(
        "CREATE",
        "RECORD",
        `Created record: ${combinedHouseId} - ${formData.name}`,
        newRecordId,
        {
          houseId: combinedHouseId,
          name: formData.name,
          street: formData.street,
          houseStatus: formData.houseStatus,
        },
      );

      showSuccessToast(
        "Berhasil",
        `Data Hunian ${combinedHouseId} telah tersimpan.`,
      );

      // Reset form or navigate away
      setFormData(initialFormState);
      router.replace("/dashboard/(secure)/data-view"); // Option to go to the list page
    } catch (error: any) {
      console.error("Save Error:", error);
      showErrorToast(
        "Gagal Menyimpan",
        "Terjadi kesalahan saat menyimpan data. Hubungi Admin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = useCallback(
    (value: string) => handleChange("name", value),
    [handleChange],
  );
  const handleHousePrefixChange = useCallback(
    (value: string) => handleChange("housePrefix", value.toUpperCase()),
    [handleChange],
  );
  const handleHouseSuffixChange = useCallback(
    (value: string) => handleChange("houseSuffix", value),
    [handleChange],
  );
  const handleStreetChange = useCallback(
    (value: string) => handleChange("street", value),
    [handleChange],
  );
  const handleHouseStatusChange = useCallback(
    (status: string) => handleChange("houseStatus", status),
    [handleChange],
  );
  const handleGenderChange = useCallback(
    (gender: string) => handleChange("gender", gender),
    [handleChange],
  );
  const handleDomicileChange = useCallback(
    (status: string) => handleChange("domicile", status),
    [handleChange],
  );
  const handleDateOccupiedChange = useCallback(
    (date: Date | string) => handleChange("dateOccupied", date),
    [handleChange],
  );

  const handleAdultMaleChange = useCallback(
    (value: string) => {
      const numericValue = value.replace(/[^0-9]/g, "");
      handleChange(
        "adultMale",
        numericValue === "" ? "" : parseInt(numericValue, 10),
      );
    },
    [handleChange],
  );

  const handleAdultFemaleChange = useCallback(
    (value: string) => {
      const numericValue = value.replace(/[^0-9]/g, "");
      handleChange(
        "adultFemale",
        numericValue === "" ? "" : parseInt(numericValue, 10),
      );
    },
    [handleChange],
  );

  const handleKidsMaleChange = useCallback(
    (value: string) => {
      const numericValue = value.replace(/[^0-9]/g, "");
      handleChange(
        "kidsMale",
        numericValue === "" ? "" : parseInt(numericValue, 10),
      );
    },
    [handleChange],
  );

  const handleKidsFemaleChange = useCallback(
    (value: string) => {
      const numericValue = value.replace(/[^0-9]/g, "");
      handleChange(
        "kidsFemale",
        numericValue === "" ? "" : parseInt(numericValue, 10),
      );
    },
    [handleChange],
  );

  const keyboardVerticalOffset = Platform.OS === "android" ? 75 : 100;

  return (
    <KeyboardAvoidingView
      behavior="height"
      style={{ flex: 1 }}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View className="flex-1 bg-gray-50">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, alignItems: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Gradient */}
          <LinearGradient
            colors={["#4F46E5", "#818CF8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full pt-12 pb-16 px-6 rounded-b-[40px] shadow-xl shadow-indigo-200 mb-[-40px] z-0"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-indigo-100 font-medium text-lg">
                  Input Data Baru
                </Text>
                <Text className="text-3xl font-extrabold text-white mt-1">
                  Pendataan Warga
                </Text>
              </View>
              <View className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                <Ionicons name="create-outline" size={28} color="white" />
              </View>
            </View>
          </LinearGradient>

          {/* Main Form Card */}
          <View className="w-full max-w-lg self-center px-4 z-10">
            <Animated.View
              entering={FadeInDown.delay(200).duration(600).springify()}
              className="w-full"
            >
              <View className="bg-white rounded-3xl shadow-lg shadow-gray-200 p-6 mb-6">
                <Text className="text-xs text-gray-500 mb-6 pb-4 border-b border-gray-100 text-center">
                  Mohon isi data sebenar-benarnya dengan lengkap dan akurat.
                </Text>

                {/* Name */}
                <FormInput
                  label="Nama Penghuni"
                  value={formData.name}
                  onChangeText={handleNameChange}
                  placeholder="Contoh: Budi Santoso"
                  keyboardType="default"
                  icon={
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                  }
                />

                {/* House Status Selector */}
                <Text className="font-semibold text-gray-700 mt-4 mb-3 ml-1">
                  Status Hunian
                </Text>
                <View className="flex-row justify-between gap-2 mb-4">
                  {["Kosong", "Ditempati", "Sewa"].map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => handleHouseStatusChange(status)}
                      className={`flex-1 p-3 rounded-xl border items-center justify-center shadow-sm
                    ${formData.houseStatus === status
                          ? "bg-indigo-600 border-indigo-600 shadow-indigo-200"
                          : "bg-white border-gray-200"
                        }`}
                    >
                      <Text
                        className={`font-bold text-sm ${formData.houseStatus === status ? "text-white" : "text-gray-600"}`}
                      >
                        {status}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* House ID & Street */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <FormInput
                          label="Blok"
                          value={formData.housePrefix}
                          onChangeText={handleHousePrefixChange}
                          placeholder="C28"
                          labelStyle="text-center"
                          keyboardType="default"
                          style="text-center"
                        />
                      </View>
                      <View className="flex-1">
                        <FormInput
                          label="Nomor"
                          value={formData.houseSuffix}
                          onChangeText={handleHouseSuffixChange}
                          placeholder="20"
                          labelStyle="text-center"
                          keyboardType="decimal-pad"
                          style="text-center"
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
                      onValueChange={handleStreetChange}
                      horizontal={true}
                    />
                  </View>
                </View>

                {/* Conditional Logic: Only show Gender/Totals if NOT Kosong */}
                {(formData.houseStatus === "Ditempati" ||
                  formData.houseStatus === "Sewa") && (
                    <Animated.View entering={FadeInDown.duration(400)}>
                      <Text className="font-semibold text-gray-700 mt-4 mb-3 ml-1">
                        Jenis Kelamin Penghuni
                      </Text>
                      <View className="flex-row gap-3 mb-6">
                        {["Pria", "Wanita"].map((gender) => (
                          <Pressable
                            key={gender}
                            onPress={() => handleGenderChange(gender)}
                            className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2
                                  ${formData.gender === gender ? "bg-indigo-50 border-indigo-500" : "bg-white border-gray-200"}`}
                          >
                            <Ionicons
                              name={gender === "Pria" ? "male" : "female"}
                              size={18}
                              color={
                                formData.gender === gender ? "#4F46E5" : "#6B7280"
                              }
                            />
                            <Text
                              className={`font-semibold ${formData.gender === gender ? "text-indigo-700" : "text-gray-600"}`}
                            >
                              {gender}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      {/* Totals */}
                      <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                        <Text className="text-center font-bold text-gray-700 mb-4">
                          Total Penghuni Rumah
                        </Text>
                        <View>
                          <Text className="text-center text-xs font-medium border-1 border-b pb-2">
                            Jumlah Penghuni Berdasarkan Jenis Kelamin
                          </Text>
                          <View className="flex-row gap-2">
                            <View className="flex-1 border-gray-400 border-2 border-dashed rounded-md p-2 mt-2">
                              <Text className="text-md pt-1 pb-2 text-center font-medium">
                                Dewasa
                              </Text>
                              <View className="flex-row gap-2">
                                <View className="flex-1">
                                  <FormInput
                                    label="L"
                                    value={
                                      formData.adultMale === ("" as any)
                                        ? ""
                                        : String(formData.adultMale)
                                    }
                                    onChangeText={handleAdultMaleChange}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    labelStyle="text-xs text-center"
                                    textAlign="center"
                                    style="bg-white"
                                  />
                                </View>
                                <View className="flex-1">
                                  <FormInput
                                    label="P"
                                    value={
                                      formData.adultFemale === ("" as any)
                                        ? ""
                                        : String(formData.adultFemale)
                                    }
                                    onChangeText={handleAdultFemaleChange}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    labelStyle="text-xs text-center"
                                    textAlign="center"
                                    style="bg-white"
                                  />
                                </View>
                              </View>
                            </View>
                            <View className="flex-1 border-gray-400 border-2 border-dashed rounded-md p-2 mt-2">
                              <Text className="text-md pt-1 pb-2 text-center font-medium">
                                Anak-Anak
                              </Text>
                              <View className="flex-row gap-2">
                                <View className="flex-1">
                                  <FormInput
                                    label="L"
                                    value={
                                      formData.kidsMale === ("" as any)
                                        ? ""
                                        : String(formData.kidsMale)
                                    }
                                    onChangeText={handleKidsMaleChange}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    labelStyle="text-center text-xs"
                                    textAlign="center"
                                    style="bg-white"
                                  />
                                </View>
                                <View className="flex-1">
                                  <FormInput
                                    label="P"
                                    value={
                                      formData.kidsFemale === ("" as any)
                                        ? ""
                                        : String(formData.kidsFemale)
                                    }
                                    onChangeText={handleKidsFemaleChange}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    labelStyle="text-center text-xs"
                                    textAlign="center"
                                    style="bg-white"
                                  />
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View className="flex-row gap-4 mt-6 mb-4">
                          <View className="flex-1">
                            <FormInput
                              label="Dewasa"
                              value={String(formData.adultTotal)}
                              onChangeText={() => { }}
                              placeholder="0"
                              keyboardType="numeric"
                              labelStyle="text-center text-gray-500"
                              style="text-center bg-gray-100 text-gray-500"
                              editable={false}
                            />
                          </View>
                          <View className="flex-1">
                            <FormInput
                              label="Anak-anak"
                              value={String(formData.kidsTotal)}
                              onChangeText={() => { }}
                              placeholder="0"
                              keyboardType="numeric"
                              labelStyle="text-center text-gray-500"
                              style="text-center bg-gray-100 text-gray-500"
                              editable={false}
                            />
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  )}

                {/* Date Occupied Input */}
                <View className="mt-2">
                  <DatePickerInput
                    label="Tanggal Hunian Ditempati"
                    value={
                      formData.dateOccupied instanceof Date
                        ? formData.dateOccupied
                        : undefined
                    }
                    onChange={handleDateOccupiedChange}
                    className="mb-0"
                    maxDate={new Date()}
                  />
                  <DatePlaceholder />
                </View>

                {/* Domicile Selector */}
                <Text className="font-semibold text-gray-700 mt-6 mb-3 ml-1">
                  Domisili KTP
                </Text>
                <View className="flex-row flex-wrap gap-3 mb-8">
                  {["Gunung Sari", "Lainnya"].map((domicileStatus) => (
                    <Pressable
                      key={domicileStatus}
                      onPress={() => handleDomicileChange(domicileStatus)}
                      className={`px-4 py-3 rounded-xl border flex-row items-center gap-2
                          ${formData.domicile === domicileStatus ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200"}`}
                    >
                      <Ionicons
                        name={
                          domicileStatus === "Gunung Sari" ? "location" : "map"
                        }
                        size={16}
                        color={
                          formData.domicile === domicileStatus
                            ? "white"
                            : "#6B7280"
                        }
                      />
                      <Text
                        className={`font-semibold ${formData.domicile === domicileStatus ? "text-white" : "text-gray-700"}`}
                      >
                        {domicileStatus}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
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
                  />
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
