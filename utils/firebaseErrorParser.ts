export const getFirebaseErrorMessage = (error: any): string => {
    const errorCode = error.code;
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Format email tidak valid.';
        case 'auth/user-disabled':
            return 'Akun pengguna ini telah dinonaktifkan.';
        case 'auth/user-not-found':
            return 'Pengguna tidak ditemukan.';
        case 'auth/wrong-password':
            return 'Password salah.';
        case 'auth/email-already-in-use':
            return 'Email sudah digunakan oleh akun lain.';
        case 'auth/weak-password':
            return 'Password terlalu lemah.';
        case 'auth/missing-password':
            return 'Password tidak boleh kosong.';
        case 'auth/invalid-credential':
            return 'Kredensial tidak valid.';
        case 'auth/too-many-requests':
            return 'Terlalu banyak percobaan gagal. Silakan coba lagi nanti.';
        default:
            return 'Terjadi kesalahan. Silakan coba lagi.';
    }
};
