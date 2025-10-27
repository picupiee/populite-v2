import Toast, {ToastOptions} from "react-native-toast-message"

/**
 * Custom hook to simplify showing different type of message
 */
export const useToastService = () => {
    /**
     * Shows a success toast
     * @param text1 Primary message.
     * @param text2 Secondary message / detail.
     * @param options Additional toast options.
     */
    const showSuccessToast = (text1: string, text2?: string, options?: ToastOptions) => {
        Toast.show({
            type: 'success',
            text1,
            text2,
            ...options,
        })
    }
    /**
     * Shows an error toast
     * @param text1 Primary message.
     * @param text2 Secondary message / detail.
     * @param options Additional toast options
     */
    const showErrorToast = (text1: string, text2?: string, options?: ToastOptions) => {
        Toast.show({
            type: 'error',
            text1,
            text2,
            ...options,
        })
    }
    /**
     * Shows an info toast
     * @param text1 Primary message.
     * @param text2 Secondary message / detail.
     * @param options Additional toast options
     */
    const showInfoToast = (text1: string, text2?: string, options?: ToastOptions) => {
        Toast.show({
            type: 'info',
            text1,
            text2,
            ...options,
        })
    }
    return {
        showSuccessToast,
        showErrorToast,
        showInfoToast
    }
}