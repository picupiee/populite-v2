// /utils/firestoreMappers.ts

import { PopulationRecord } from "@/constants/data";
import { DocumentData } from "firebase/firestore";

/**
 * Helper function to map Firestore data (with Timestamp) to the client model (with Date).
 */
export const mapDocToRecord = (
  docData: DocumentData,
  docId: string
): PopulationRecord => {
  // const data = docData as Omit<
  //   PopulationRecord,
  //   "id" | "entryDate" | "dateOccupied"
  // > & {
  //   entryDate: Timestamp;
  //   dateOccupied?: Timestamp; // Optional Timestamp
  // };
  const data = docData as any;

  return {
    id: docId,
    name: data.name,
    street: data.street,
    houseId: data.houseId,
    gender: data.gender,
    houseStatus: data.houseStatus,
    domicile: data.domicile,
    adultTotal: Number(data.adultTotal || 0),
    kidsTotal: Number(data.kidsTotal || 0),
    entryDate: data.entryDate.toDate(),
    dateOccupied: data.dateOccupied ? data.dateOccupied.toDate() : undefined,
  } as PopulationRecord;
};
