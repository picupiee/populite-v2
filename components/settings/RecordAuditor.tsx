import AppButton from "@/components/ui/AppButton";
import { db } from "@/lib/firebase";
import { mapDocToRecord } from "@/utils/firestoreMappers";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export interface MishapItem {
  id: string;
  houseId: string;
  name: string;
  street: string;
  houseStatus: string;
  adultTotal: number;
  adultMale: number;
  adultFemale: number;
  kidsTotal: number;
  kidsMale: number;
  kidsFemale: number;
  reasons: string[];
  canAutoFixKosong: boolean;
  canAutoFixGenderSum: boolean;
}

export default function RecordAuditorModal() {
  const [isScanning, setIsScanning] = useState(false);
  const [mishaps, setMishaps] = useState<MishapItem[]>([]);
  const [scannedCount, setScannedCount] = useState<number | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string | null>(null);

  const scanRecords = async () => {
    setIsScanning(true);
    setFixSuccessMsg(null);
    try {
      const snap = await getDocs(collection(db, "populationData"));
      const items: MishapItem[] = [];

      snap.docs.forEach((d) => {
        const r = mapDocToRecord(d.data(), d.id);
        const adultMale = Number(r.adultMale) || 0;
        const adultFemale = Number(r.adultFemale) || 0;
        const kidsMale = Number(r.kidsMale) || 0;
        const kidsFemale = Number(r.kidsFemale) || 0;
        const adultTotal = Number(r.adultTotal) || 0;
        const kidsTotal = Number(r.kidsTotal) || 0;

        const reasons: string[] = [];
        let canAutoFixKosong = false;
        let canAutoFixGenderSum = false;

        // 1. Status Kosong but population is > 0
        if (
          r.houseStatus === "Kosong" &&
          (adultTotal > 0 ||
            kidsTotal > 0 ||
            adultMale > 0 ||
            adultFemale > 0 ||
            kidsMale > 0 ||
            kidsFemale > 0)
        ) {
          reasons.push(
            `Status Kosong tapi terisi: ${adultTotal} Dewasa, ${kidsTotal} Anak`,
          );
          canAutoFixKosong = true;
        }

        // 2. Adult breakdown mismatch
        if (
          r.houseStatus !== "Kosong" &&
          adultTotal !== adultMale + adultFemale
        ) {
          reasons.push(
            `Dewasa tidak cocok: Total (${adultTotal}) ≠ L(${adultMale}) + P(${adultFemale})`,
          );
          if (adultMale + adultFemale > 0) {
            canAutoFixGenderSum = true;
          }
        }

        // 3. Kids breakdown mismatch
        if (r.houseStatus !== "Kosong" && kidsTotal !== kidsMale + kidsFemale) {
          reasons.push(
            `Anak tidak cocok: Total (${kidsTotal}) ≠ L(${kidsMale}) + P(${kidsFemale})`,
          );
          if (kidsMale + kidsFemale > 0) {
            canAutoFixGenderSum = true;
          }
        }

        if (reasons.length > 0) {
          items.push({
            id: r.id,
            houseId: r.houseId || "-",
            name: r.name || "-",
            street: r.street || "-",
            houseStatus: r.houseStatus || "-",
            adultTotal,
            adultMale,
            adultFemale,
            kidsTotal,
            kidsMale,
            kidsFemale,
            reasons,
            canAutoFixKosong,
            canAutoFixGenderSum,
          });
        }
      });

      setScannedCount(snap.docs.length);
      setMishaps(items);
    } catch (e) {
      console.error("Scan error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFixKosong = async (item: MishapItem) => {
    setFixingId(item.id);
    try {
      await updateDoc(doc(db, "populationData", item.id), {
        adultTotal: 0,
        adultMale: 0,
        adultFemale: 0,
        kidsTotal: 0,
        kidsMale: 0,
        kidsFemale: 0,
      });
      setMishaps((prev) => prev.filter((m) => m.id !== item.id));
      setFixSuccessMsg(`Rumah ${item.houseId} berhasil di-reset ke 0!`);
    } catch (err) {
      console.error("Fix error:", err);
    } finally {
      setFixingId(null);
    }
  };

  const handleFixGenderSync = async (item: MishapItem) => {
    setFixingId(item.id);
    try {
      const correctAdultTotal = item.adultMale + item.adultFemale;
      const correctKidsTotal = item.kidsMale + item.kidsFemale;
      await updateDoc(doc(db, "populationData", item.id), {
        adultTotal: correctAdultTotal,
        kidsTotal: correctKidsTotal,
      });
      setMishaps((prev) => prev.filter((m) => m.id !== item.id));
      setFixSuccessMsg(`Rumah ${item.houseId} total diselaraskan dengan L+P!`);
    } catch (err) {
      console.error("Fix error:", err);
    } finally {
      setFixingId(null);
    }
  };

  return (
    <View className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name="scan-circle" size={24} color="#4F46E5" />
        <Text className="text-base font-bold text-gray-800">
          Scanner Audit Data Warga
        </Text>
      </View>
      <Text className="text-xs text-gray-500 mb-3">
        Memeriksa seluruh database untuk mendeteksi rumah Kosong yang masih
        memiliki populasi, atau data yang jumlah Total-nya tidak sinkron dengan
        L/P.
      </Text>

      <AppButton
        title={isScanning ? "Memindai Database..." : "🔍 Pindai Semua Data"}
        onPress={scanRecords}
        disabled={isScanning}
        variant="primary"
        className="mb-2"
      />

      {isScanning && (
        <View className="py-4 items-center">
          <ActivityIndicator color="#4F46E5" />
          <Text className="text-xs text-gray-500 mt-2">
            Sedang membaca koleksi populationData...
          </Text>
        </View>
      )}

      {fixSuccessMsg && (
        <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 my-2">
          <Text className="text-xs font-semibold text-emerald-700 text-center">
            ✓ {fixSuccessMsg}
          </Text>
        </View>
      )}

      {scannedCount !== null && !isScanning && (
        <View className="mt-2">
          {mishaps.length === 0 ? (
            <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 items-center">
              <Ionicons name="checkmark-circle" size={24} color="#059669" />
              <Text className="text-xs font-bold text-emerald-800 mt-1">
                Semua data bersih & sinkron!
              </Text>
              <Text className="text-[11px] text-emerald-600">
                {scannedCount} data telah diperiksa, tidak ada kejanggalan.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                <Text className="text-xs font-bold text-amber-800">
                  Ditemukan {mishaps.length} data dengan kejanggalan:
                </Text>
              </View>

              {mishaps.map((item) => (
                <View
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs mt-2"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-2">
                      <Text className="font-bold text-gray-900 text-sm">
                        {item.houseId} • {item.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {item.street} • Status: {item.houseStatus}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        router.push(
                          `/dashboard/(secure)/data-view/edit/${item.id}` as any,
                        )
                      }
                      className="bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200"
                    >
                      <Text className="text-xs font-medium text-indigo-600">
                        Buka Edit
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="mt-2 bg-rose-50 border border-rose-100 rounded-lg p-2">
                    {item.reasons.map((r, i) => (
                      <Text
                        key={i}
                        className="text-[11px] text-rose-700 font-medium"
                      >
                        ⚠️ {r}
                      </Text>
                    ))}
                  </View>

                  {/* Quick Fix Actions */}
                  <View className="flex-row gap-2 mt-2">
                    {item.canAutoFixKosong && (
                      <TouchableOpacity
                        disabled={fixingId === item.id}
                        onPress={() => handleFixKosong(item)}
                        className="flex-1 bg-amber-500 py-1.5 rounded-lg items-center"
                      >
                        <Text className="text-xs font-bold text-white">
                          {fixingId === item.id
                            ? "Memproses..."
                            : "Reset ke 0 (Kosong)"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {item.canAutoFixGenderSum && (
                      <TouchableOpacity
                        disabled={fixingId === item.id}
                        onPress={() => handleFixGenderSync(item)}
                        className="flex-1 bg-indigo-600 py-1.5 rounded-lg items-center"
                      >
                        <Text className="text-xs font-bold text-white">
                          {fixingId === item.id
                            ? "Memproses..."
                            : "Sinkronkan Total = L+P"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
