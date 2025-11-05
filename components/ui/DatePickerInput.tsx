import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
// 💡 IMPORTANT: Ensure you have installed react-native-paper and the date picker
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  DatePickerModal,
  id,
  registerTranslation,
} from "react-native-paper-dates";
registerTranslation("id", id);

interface DatePickerInputProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
  error?: string | null;
  placeholder?: string;
  className?: string;
}

export default function DatePickerInput({
  label,
  value,
  onChange,
  error = null,
  placeholder = "Select Date",
  className = "",
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);

  const onDismissSingle = React.useCallback(() => {
    setOpen(false);
  }, []);

  // Handler for when the user selects a date from the modal
  const onConfirmSingle = React.useCallback(
    (params: { date: Date | undefined }) => {
      setOpen(false);
      if (params.date) {
        // Paper Dates returns the date object. We pass it directly to the form's state handler.
        onChange(params.date);
      }
    },
    [onChange]
  );

  const displayValue = value ? value.toLocaleDateString() : placeholder;

  return (
    <View className={`mb-4 ${className}`}>
      {/* Label */}
      <Text className="text-sm font-medium mb-1 text-gray-700">{label}</Text>

      {/* Input Field (Pressable to trigger modal) */}
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between border rounded-lg p-3 text-base 
          ${error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}`}
      >
        <Text
          className={`text-base ${value ? "text-gray-800" : "text-gray-400"}`}
        >
          {displayValue}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
      </Pressable>

      {/* Error Message */}
      {error && (
        <Text className="text-xs text-red-600 mt-1 font-medium">{error}</Text>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        locale="id" // Set locale if necessary (e.g., 'id' for Indonesia)
        mode="single"
        visible={open}
        onDismiss={onDismissSingle}
        onConfirm={onConfirmSingle}
        date={value} // Current date from form state
        // You can set valid range limits here:
        // startDate={new Date(2000, 0, 1)}
        // endDate={new Date()}
        validRange={{
          endDate: new Date(), // Prevents selection of future dates
        }}
        
      />
    </View>
  );
}
