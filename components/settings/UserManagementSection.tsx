import { useAuth } from "@/context/AuthProvider";
import { useToastService } from "@/hooks/useToastService";
import { db } from "@/lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppButton from "../ui/AppButton";

interface UserData {
  uid: string;
  email: string;
  role: "admin" | "staff" | "viewer";
  fullName?: string;
}

export default function UserManagementSection() {
  const { user, role: currentUserRole } = useAuth();
  const { showSuccessToast, showErrorToast } = useToastService();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserData;
        // Don't list the current user to prevent self-lockout or weird states
        if (data.uid !== user?.uid) {
          usersData.push(data);
        }
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      showErrorToast("Gagal", "Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserRole === "admin") {
      fetchUsers();
    }
  }, [currentUserRole]);

  const handleRoleUpdate = async (newRole: "admin" | "staff" | "viewer") => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const userRef = doc(db, "users", selectedUser.uid);
      await updateDoc(userRef, { role: newRole });

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUser.uid ? { ...u, role: newRole } : u
        )
      );

      showSuccessToast("Berhasil", "Peran pengguna berhasil diperbarui.");
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user role:", error);
      showErrorToast("Gagal", "Gagal memperbarui peran pengguna.");
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "staff":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (currentUserRole !== "admin") return null;

  return (
    <View className="bg-white rounded-xl p-4 mt-6 border border-gray-100 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <View className="bg-indigo-100 p-2 rounded-lg">
            <Ionicons name="people" size={20} color="#4F46E5" />
          </View>
          <Text className="text-lg font-bold text-gray-900">
            Kelola Pengguna
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchUsers}
          className="bg-gray-100 p-2 rounded-lg"
        >
          <Ionicons name="refresh" size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#4F46E5" />
      ) : users.length === 0 ? (
        <Text className="text-gray-500 text-center py-4">
          Tidak ada pengguna lain ditemukan.
        </Text>
      ) : (
        <View className="space-y-3">
          {users.map((item) => (
            <View
              key={item.uid}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-gray-900" numberOfLines={1}>
                  {item.fullName || "Tanpa Nama"}
                </Text>
                <Text className="text-xs text-gray-500" numberOfLines={1}>
                  {item.email}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setSelectedUser(item);
                  setShowRoleModal(true);
                }}
                className={`px-3 py-1 rounded-full ${getRoleBadgeColor(
                  item.role
                )}`}
              >
                <Text
                  className={`text-xs font-semibold ${getRoleBadgeColor(item.role).split(" ")[1]}`}
                >
                  {item.role.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-sm p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Ubah Peran Pengguna
            </Text>
            <Text className="text-gray-500 mb-6">
              Pilih peran baru untuk {selectedUser?.email}
            </Text>

            <View className="space-y-3">
              {(["admin", "staff", "viewer"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => handleRoleUpdate(r)}
                  disabled={updating}
                  className={`flex-row items-center justify-between p-4 rounded-xl border ${
                    selectedUser?.role === r
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedUser?.role === r
                          ? "border-indigo-500"
                          : "border-gray-300"
                      } items-center justify-center`}
                    >
                      {selectedUser?.role === r && (
                        <View className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </View>
                    <Text
                      className={`font-semibold ${
                        selectedUser?.role === r
                          ? "text-indigo-900"
                          : "text-gray-700"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <AppButton
              title="Batal"
              variant="secondary"
              onPress={() => setShowRoleModal(false)}
              className="mt-6"
              disabled={updating}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
