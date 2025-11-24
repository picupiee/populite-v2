import AppButton from "@/components/ui/AppButton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FormInput from "@/components/ui/FormInput";
import SelectGroup from "@/components/ui/SelectGroup";
import { FINANCE_INCOME_SOURCES } from "@/constants/finance";
import { useAccess } from "@/hooks/useAccess";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useFinanceMutations } from "@/hooks/useFinanceMutations";
import { useToastService } from "@/hooks/useToastService";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

interface IncomeFormData {
  date: Date | undefined;
  source: string;
  familyCount: string;
  amount: string;
  note: string;
}

const TARGET_SOURCE_ID = "disposal_fee";

const INITIAL_FORM: IncomeFormData = {
  date: new Date(),
  source: TARGET_SOURCE_ID,
  familyCount: "",
  amount: "",
  note: "",
};

export default function IncomeForm() {
  const router = useRouter();
  const { addIncome } = useFinanceMutations();
  const { logActivity } = useActivityLog();
  const { showSuccessToast, showErrorToast } = useToastService();
  const { can, PERMISSIONS } = useAccess();
  const canCreate = can(PERMISSIONS.CREATE_FINANCE_ENTRY);

  const [formData, setFormData] = useState<IncomeFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IncomeFormData, string>>
  >({});

  const requireFamilyCount = formData.source === TARGET_SOURCE_ID;

  // Input handle function
  const handleChange = (key: keyof IncomeFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Validation Logic
  const validate = () => {
    const newErrors: Partial<Record<keyof IncomeFormData, string>> = {};
    const amount = parseFloat(formData.amount);
    const familyCount = parseInt(formData.familyCount || "0");

    if (!formData.date) newErrors.date = "Tanggal wajib diisi.";
    if (!formData.source) newErrors.source = "Sumber wajib dipilih.";
    if (isNaN(amount) || amount <= 0)
      newErrors.amount = "Jumlah harus angka positif.";
    if (requireFamilyCount) {
      if (isNaN(familyCount) || familyCount < 0)
        newErrors.familyCount = "Jumlah KK tidak valid.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submission Handler
  const handleSubmit = async () => {
    if (!canCreate || saving) return;
    if (!validate()) return;

    setSaving(true);
    Keyboard.dismiss();

    try {
      await addIncome({
        date: formData.date as Date,
        source: formData.source,
        familyCount: requireFamilyCount ? parseInt(formData.familyCount) : 0,
        amount: parseFloat(formData.amount),
        note:
          formData.note ||
          FINANCE_INCOME_SOURCES.find((s) => s.id === formData.source)?.note,
      });

      await logActivity(
        "CREATE",
        "FINANCE",
        `Created income: ${formData.amount} from ${selectedSourceLabel}`,
        undefined, // ID not returned by addIncome hook wrapper currently, can be improved later if needed
        {
          type: "INCOME",
          amount: parseFloat(formData.amount),
          source: formData.source,
          note: formData.note,
        }
      );

      showSuccessToast("Berhasil", "Data Penerimaan kas telah disimpan");
      setFormData(INITIAL_FORM);
      router.replace("/dashboard/finance");
    } catch (e: any) {
      console.error("Income submission failed");
      showErrorToast(
        "Gagal Menyimpan",
        e.message || "Data Penerimaan Kas Gagal Disimpan"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-xl font-bold text-red-500">Akses Ditolak</Text>
        <Text className="text-center text-gray-600 mt-2">
          Anda tidak memiliki izin untuk mengakses pendataan pemasukan /
          pengeluaran kas !
        </Text>
        <AppButton
          title="Kembali ke Beranda"
          onPress={() => router.back()}
          variant="danger"
        />
      </View>
    );
  }

  const incomeOptions = FINANCE_INCOME_SOURCES.map((s) => s.label);
  const selectedSourceLabel =
    FINANCE_INCOME_SOURCES.find((s) => s.id === formData.source)?.label ||
    "Pilih Sumber";

  const keyboardVerticalOffset = Platform.OS === "android" ? 75 : 100;

  // -- Render Form --
  return (
    <KeyboardAvoidingView
      behavior="height"
      style={{ flex: 1, paddingBottom: 0 }}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      >
        <Stack.Screen options={{ title: "Catat Penerimaan Kas" }} />

        <Text className="text-2xl font-bold mb-6 text-gray-800">
          Pencatatan Penerimaan Kas
        </Text>

        {/* Date Input */}
        <DatePickerInput
          label="Tanggal Penerimaan"
          value={formData.date}
          onChange={(date) => handleChange("date", date)}
          error={errors.date}
          maxDate={new Date()} // Income should be today or a past date
        />

        {/* Select Group: Source of Income */}
        <SelectGroup
          label="Sumber Penerimaan"
          options={incomeOptions}
          selectedValue={selectedSourceLabel}
          onValueChange={(label) => {
            // Map label back to its ID for storage
            const id =
              FINANCE_INCOME_SOURCES.find((s) => s.label === label)?.id ||
              label;
            handleChange("source", id);
          }}
          className="mb-4"
          horizontal={false} // Use vertical layout for better readability
        />

        {/* Input: Total Family Paid */}
        {requireFamilyCount && (
          <FormInput
            label="Jumlah Keluarga (KK) Membayar"
            value={formData.familyCount}
            onChangeText={(text) =>
              handleChange("familyCount", text.replace(/[^0-9]/g, ""))
            } // Allow only numbers
            placeholder="e.g., 50"
            keyboardType="numeric"
            error={errors.familyCount}
          />
        )}

        {/* Input: Amount */}
        <FormInput
          label="Jumlah Uang Diterima (Rp)"
          value={formData.amount}
          onChangeText={(text) =>
            handleChange("amount", text.replace(/[^0-9.]/g, ""))
          } // Allow numbers and dot
          placeholder="e.g., 500000"
          keyboardType="numeric"
          error={errors.amount}
        />

        {/* Input: Note/Description */}
        <FormInput
          label="Keterangan Tambahan (Opsional)"
          value={formData.note}
          onChangeText={(text) => handleChange("note", text)}
          placeholder="Contoh: Kas RT + Sampah bulan Mei"
          multiline
        />

        {/* Submit Button */}
        <AppButton
          onPress={handleSubmit}
          title="Catat Penerimaan"
          loadingText="Mencatat..."
          variant="primary"
          isLoading={saving}
          className="mt-6"
        />
        <AppButton
          onPress={() => router.replace("/dashboard/finance")}
          title="Batal"
          variant="danger"
          className="mt-3"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
