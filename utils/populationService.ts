import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const COLLECTION_NAME = "populationData";

/**
 * Checks if a houseId already exists in the database
 * @param houseId The combined house ID string (e.g., "C28/19")
 * @returns A promise that resolves to true if the ID exists, false otherwise.
 */
export const checkHouseIdExists = async (houseId: string): Promise<boolean> => {
  try {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, where("houseId", "==", houseId));

    const querySnapshot = await getDocs(q);

    return querySnapshot.size > 0;
  } catch (error) {
    console.error("Error checking for duplicate house ID: ", error);
    throw new Error(
      "Gagal melakukan cek ID dari database. Silahkan coba kembali"
    );
  }
};
