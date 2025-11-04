import { PopulationRecord } from "@/constants/data";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface CompactListItemProps {
  record: PopulationRecord;
}

export default function CompactListItem({ record }: CompactListItemProps) {
  // Determine color based on status for a small visual cue
  const statusColor =
    record.houseStatus === "Kosong"
      ? "bg-red-500"
      : record.houseStatus === "Sewa"
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <Link href={`/dashboard/(secure)/data-view/data/${record.id}`} asChild>
      <Pressable className="flex-row items-center justify-between py-2 px-3 border-b border-gray-100 active:bg-gray-50">
        {/* Status Indicator */}
        <View className={`w-2 h-2 rounded-full mr-3 ${statusColor}`} />

        {/* Details: House ID & Name */}
        <View className="flex-1 flex-row items-center">
          <Text className="w-1/4 font-bold text-gray-800 text-sm">
            {record.houseId}
          </Text>
          <Text className="w-2/4 text-gray-600 text-sm truncate">
            {record.name}
          </Text>
          <Text className="w-1/4 text-gray-500 text-xs text-right">
            {record.street}
          </Text>
        </View>

        {/* Action Button */}
        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color="#6366F1" // Indigo
          className="ml-4"
        />
      </Pressable>
    </Link>
  );
}
