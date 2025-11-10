// hooks/useActivityMonitor.ts
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Re-define constants used by the AuthProvider for modularity
const SESSION_KEY = '@session_timestamp';
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes check interval (less than 30 min timeout)

// Helper function to update the session timestamp
const updateSessionTimestamp = async () => {
    try {
        const now = new Date().getTime().toString();
        await AsyncStorage.setItem(SESSION_KEY, now);
        // console.log("Session timestamp updated."); // Optional: for debugging
    } catch (e) {
        console.error("Error setting session timestamp:", e);
    }
};

/**
 * Hook to monitor user activity and reset the session expiration timer.
 * This should be used on all secured screens/layouts.
 */
export const useActivityMonitor = () => {
    useEffect(() => {
        // 1. Set up an interval timer
        // This timer runs every 5 minutes and updates the timestamp, 
        // effectively resetting the 30-minute inactivity timer.
        const interval = setInterval(() => {
            updateSessionTimestamp();
        }, CHECK_INTERVAL_MS); 

        // 2. Run an initial update when the component mounts
        // This is important for the first load into the secured area.
        updateSessionTimestamp();

        // 3. Cleanup function
        // Stops the timer when the component is unmounted (e.g., user logs out or closes app).
        return () => {
            clearInterval(interval);
            // console.log("Activity monitor cleaned up."); // Optional: for debugging
        };
    }, []); // Empty dependency array means it only runs on mount/unmount
};