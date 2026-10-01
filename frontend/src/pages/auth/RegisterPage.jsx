/**
 * RegisterPage — Re-export ke LoginPage (Unified Auth)
 * Rute /register dan /login kini diarahkan ke komponen yang sama.
 * LoginPage secara internal mendeteksi pathname dan menyesuaikan teks heading.
 */
export { default } from './LoginPage'
