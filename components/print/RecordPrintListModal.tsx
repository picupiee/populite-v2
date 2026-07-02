import AppButton from "@/components/ui/AppButton";
import { STREET_OPTIONS } from "@/constants/data";
import { PrintOptions } from "@/utils/recordsPdf";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface RecordPrintListModalProps {
  visible: boolean;
  onClose: () => void;
  onPrint: (options: PrintOptions) => void;
}

export default function RecordPrintListModal({
  visible,
  onClose,
  onPrint,
}: RecordPrintListModalProps) {
  const [street, setStreet] = useState<string[]>(["Semua"]);
  const [populationFilter, setPopulationFilter] = useState<
    "all" | "adults_only" | "kids_only"
  >("all");
  const [reportType, setReportType] = useState<"summary" | "detailed" | "simple_list">(
    "detailed"
  );
  const [hideNames, setHideNames] = useState<boolean>(false);
  const [hideSummary, setHideSummary] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>("");

  const STREET_FILTER_OPTIONS = ["Semua", ...STREET_OPTIONS];
  const POPULATION_OPTIONS = ["all", "adults_only", "kids_only"];
  const REPORT_TYPE_OPTIONS = ["detailed", "simple_list", "summary"];

  const toggleStreet = (value: string) => {
    if (value === "Semua") {
      setStreet(["Semua"]);
      return;
    }

    setStreet((prev) => {
      // If we are selecting a specific street and "Semua" is currently selected, clear "Semua"
      let newStreets = prev.includes("Semua") ? [] : [...prev];

      if (newStreets.includes(value)) {
        newStreets = newStreets.filter((s) => s !== value);
      } else {
        newStreets.push(value);
      }

      // If nothing left, valid? Or default back to Semua?
      // Let's keep it empty if user deselects all, or maybe default to Semua.
      // Better UX: If empty, go back to Semua.
      if (newStreets.length === 0) {
        return ["Semua"];
      }

      return newStreets;
    });
  };

  const getLabel = (value: string) => {
    switch (value) {
      case "all":
        return "Semua";
      case "adults_only":
        return "Dewasa Saja";
      case "kids_only":
        return "Anak-anak Saja";
      case "detailed":
        return "Laporan Detail";
      case "simple_list":
        return "Daftar Sederhana";
      case "summary":
        return "Ringkasan Eksekutif";
      default:
        return value;
    }
  };

  const handlePrint = () => {
    onPrint({
      street,
      populationFilter,
      reportType,
      hideNames,
      hideSummary,
      customTitle,
    });
    // Optional: Reset state or keep it? Keeping it might be better for consistent UX if re-opening.
    // onClose(); // Let parent handle closing if needed, or close here.
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 h-[85%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-800">
              Opsi Cetak Laporan
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 bg-gray-100 rounded-full"
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 0. Judul Laporan */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wider">
                Judul Laporan (Opsional)
              </Text>
              <TextInput
                value={customTitle}
                onChangeText={setCustomTitle}
                placeholder="Kosongkan untuk judul bawaan"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 1. Pilih Jalan */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wider">
                Lokasi / Jalan (Bisa pilih &gt; 1)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {STREET_FILTER_OPTIONS.map((opt) => {
                  const isSelected = street.includes(opt);
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => toggleStreet(opt)}
                      className={`px-4 py-2 rounded-full border ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <Text
                        className={`${
                          isSelected
                            ? "text-white font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Filter Populasi */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wider">
                Kategori Warga
              </Text>
              <View className="flex-col gap-2">
                {POPULATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setPopulationFilter(opt as any)}
                    className={`flex-row items-center p-3 rounded-xl border ${
                      populationFilter === opt
                        ? "bg-indigo-50 border-indigo-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${
                        populationFilter === opt
                          ? "border-indigo-600"
                          : "border-gray-400"
                      }`}
                    >
                      {populationFilter === opt && (
                        <View className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      )}
                    </View>
                    <Text
                      className={`${
                        populationFilter === opt
                          ? "text-indigo-800 font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {getLabel(opt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Tipe Laporan */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-500 uppercase mb-3 tracking-wider">
                Format Laporan
              </Text>
              <View className="flex-row gap-3">
                {REPORT_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setReportType(opt as any)}
                    className={`flex-1 p-4 rounded-xl border items-center ${
                      reportType === opt
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name={
                        opt === "summary"
                          ? "stats-chart-outline"
                          : opt === "simple_list"
                          ? "list-circle-outline"
                          : "list-outline"
                      }
                      size={24}
                      color={reportType === opt ? "white" : "#666"}
                      style={{ marginBottom: 5 }}
                    />
                    <Text
                      className={`text-center font-medium ${
                        reportType === opt ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {getLabel(opt)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 4. Opsi Tambahan (Privacy & Layout) */}
            {reportType !== "summary" && (
              <View className="mb-8 bg-orange-50 p-4 rounded-xl border border-orange-100 gap-4">
                {/* Hide Names Toggle */}
                <TouchableOpacity
                  onPress={() => setHideNames(!hideNames)}
                  className="flex-row items-center"
                >
                  <View
                    className={`w-6 h-6 rounded border items-center justify-center mr-3 ${
                      hideNames
                        ? "bg-orange-500 border-orange-500"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {hideNames && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold">
                      Sembunyikan Nama Warga
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      Hanya menampilkan alamat dan jumlah penghuni.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Hide Summary Toggle */}
                <TouchableOpacity
                  onPress={() => setHideSummary(!hideSummary)}
                  className="flex-row items-center pt-2 border-t border-orange-200/50"
                >
                  <View
                    className={`w-6 h-6 rounded border items-center justify-center mr-3 ${
                      hideSummary
                        ? "bg-orange-500 border-orange-500"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {hideSummary && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold">
                      Sembunyikan Ringkasan Eksekutif
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      Tidak menampilkan tabel ringkasan di awal halaman.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View className="pt-4 border-t border-gray-100 flex-row gap-4">
            <AppButton
              title="Batal"
              onPress={onClose}
              variant="outline"
              className="flex-1"
            />
            <AppButton
              title="Cetak PDF"
              onPress={handlePrint}
              variant="primary"
              className="flex-1"
              icon={<Ionicons name="print-outline" size={20} color="white" />}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
