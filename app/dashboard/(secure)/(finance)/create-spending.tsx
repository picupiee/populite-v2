import AppButton from "@/components/ui/AppButton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FormInput from "@/components/ui/FormInput";
import SelectGroup from "@/components/ui/SelectGroup";
import { FINANCE_SPENDING_TYPES } from "@/constants/finance";
import { useAccess } from "@/hooks/useAccess";
import { useFinanceMutations } from "@/hooks/useFinanceMutations";
import { useToastService } from "@/hooks/useToastService";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

interface SpendingFormData {
    date: Date | undefined;
    type: string;
    amount: string;
    quantity: string
    note: string
}

const INITIAL_FORM: SpendingFormData = {
    date: new Date(),
    type: FINANCE_SPENDING_TYPES[0].id,
    amount: "",
    quantity: "1",
    note: ""
}

export default function SpendingForm() {
    const router = useRouter();
    const { addSpending } = useFinanceMutations();
    const { showSuccessToast, showErrorToast } = useToastService()
    const { can, PERMISSIONS } = useAccess();
    const canCreate = can(PERMISSIONS.CREATE_FINANCE_ENTRY);

    const [formData, setFormData] = useState<SpendingFormData>(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof SpendingFormData, string>>>({});

    // Input handle function
    const handleChange = (key: keyof SpendingFormData, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value
        }))
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    }

    // Validation Logic
    const validate = () => {
        const newErrors: Partial<Record<keyof SpendingFormData, string>> = {};
        const amount = parseFloat(formData.amount);
        const quantity = parseInt(formData.quantity);

        if (!formData.date) newErrors.date = "Tanggal wajib diisi.";
        if (!formData.type) newErrors.type = "Tipe Pengeluaran wajib dipilih.";
        if (isNaN(amount) || amount <= 0) newErrors.amount = "Jumlah harus angka positif.";
        if (isNaN(quantity) || quantity < 0) newErrors.quantity = "Jumlah Satuan Tidak Valid.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submission Handler
    const handleSubmit = async () => {
        if (!canCreate || saving) return;
        if (!validate()) return;

        setSaving(true)
        Keyboard.dismiss();

        try {
            await addSpending({
                date: formData.date as Date,
                type: formData.type,
                quantity: parseInt(formData.quantity),
                amount: parseFloat(formData.amount),
                note: formData.note || FINANCE_SPENDING_TYPES.find(s => s.id === formData.type)?.note,
            });

            showSuccessToast(
                "Berhasil",
                "Data Pengeluaran kas telah disimpan"
            )
            setFormData(INITIAL_FORM)
            router.replace("/dashboard/finance")
        } catch (e: any) {
            console.error("Spending submission failed")
            showErrorToast("Gagal Menyimpan", e.message || "Data Pengeluaran Kas Gagal Disimpan")
        } finally {
            setSaving(false)
        }
    }

    if (!canCreate) {
        return (
            <View className="flex-1 items-center justify-center p-5">
                <Text className="text-xl font-bold text-red-500">Akses Ditolak</Text>
                <Text className="text-center text-gray-600 mt-2">Anda tidak memiliki izin untuk mengakses pendataan pemasukan / pengeluaran kas !</Text>
                <AppButton title="Kembali ke Beranda" onPress={() => router.back()} variant="danger" />
            </View>
        )
    }

    const spendingOptions = FINANCE_SPENDING_TYPES.map(s => s.label);
    const selectedTypeLabel = FINANCE_SPENDING_TYPES.find(s => s.id === formData.type)?.label || "Tipe Pengeluaran";

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
                <Stack.Screen options={{ title: "Catat Pengeluaran Kas" }} />

                <Text className="text-2xl font-bold mb-6 text-gray-800">
                    Pencatatan Pengeluaran Kas
                </Text>

                {/* Date Input */}
                <DatePickerInput
                    label="Tanggal Pengeluaran"
                    value={formData.date}
                    onChange={(date) => handleChange("date", date)}
                    error={errors.date}
                    maxDate={new Date()} // Income should be today or a past date
                />

                {/* Select Group: Source of Income */}
                <SelectGroup
                    label="Tipe Pengeluaran"
                    options={spendingOptions}
                    selectedValue={selectedTypeLabel}
                    onValueChange={(label) => {
                        // Map label back to its ID for storage
                        const id = FINANCE_SPENDING_TYPES.find(s => s.label === label)?.id || label;
                        handleChange("type", id);
                    }}
                    className="mb-4"
                    horizontal={false} // Use vertical layout for better readability
                />

                {/* Input: Quantity of Spendings */}
                <FormInput
                    label="Jumlah Satuan"
                    value={formData.quantity}
                    onChangeText={(text) => handleChange("quantity", text.replace(/[^0-9]/g, ''))} // Allow only numbers
                    placeholder="e.g., 50"
                    keyboardType="numeric"
                    error={errors.quantity}
                />

                {/* Input: Amount */}
                <FormInput
                    label="Jumlah Uang Dikeluarkan (Rp)"
                    value={formData.amount}
                    onChangeText={(text) => handleChange("amount", text.replace(/[^0-9.]/g, ''))} // Allow numbers and dot
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
                    title="Catat Pengeluaran"
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
    )
}