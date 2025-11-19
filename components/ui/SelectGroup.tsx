import React from "react";
import { Pressable, Text, View } from "react-native";

interface SelectGroupProps<T extends string> {
  label: string;
  options: T[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  className?: string;
  horizontal?: boolean;
}

export default function SelectGroup<T extends string>({
  label,
  options,
  selectedValue,
  onValueChange,
  className = "",
  horizontal = true, // Default to horizontal layout for compact lists/forms
}: SelectGroupProps<T>) {
  const containerClasses = horizontal
    ? "flex-row flex-wrap justify-start gap-2"
    : "flex-col gap-2";

  return (
    <View className={`mb-4 ${className}`}>
      <Text className="text-sm font-bold mb-1 text-gray-700">{label}</Text>
      <View className={containerClasses}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onValueChange(option)}
            className={`p-2 rounded-lg border flex-grow items-center 
              ${selectedValue === option ? "bg-indigo-600 border-indigo-700" : "bg-white border-gray-300"}`}
          >
            <Text
              className={`font-semibold text-sm ${selectedValue === option ? "text-white" : "text-gray-700"}`}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
