import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (revisionNumber?: string) => void;
}

export default function MonthlyReportModal({
  visible,
  onClose,
  onConfirm,
}: Props) {
  const [revision, setRevision] = useState("");

  const handleConfirm = () => {
    onConfirm(revision);
    setRevision(""); // Reset on confirm
  };

  const handleClose = () => {
    setRevision(""); // Reset on close
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Laporan Bulanan
            </Text>
            <TouchableOpacity onPress={handleClose} className="p-1">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-gray-600 mb-4">
            Anda dapat menambahkan nomor revisi untuk laporan ini (Opsional). Jika
            dikosongkan, laporan akan dibuat tanpa keterangan revisi.
          </Text>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Nomor Revisi
            </Text>
            <TextInput
              value={revision}
              onChangeText={setRevision}
              placeholder="Contoh: 1, 2, atau 1.1"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 items-center"
            >
              <Text className="font-semibold text-gray-700">Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 items-center"
            >
              <Text className="font-semibold text-white">Buat Laporan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
