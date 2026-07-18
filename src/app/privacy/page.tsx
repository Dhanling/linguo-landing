import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Linguo.id",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <header className="bg-[#1A9E9E] py-4">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/">
            <img src="/images/logo-white.png" alt="Linguo.id" className="h-8 object-contain" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Terakhir diperbarui: 18 Juli 2026</p>

        <div className="prose prose-slate prose-sm max-w-none space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Informasi yang Kami Kumpulkan</h2>
            <p>Linguo.id ("kami") mengumpulkan informasi berikut saat Anda menggunakan layanan kami:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nama lengkap, alamat email, dan nomor WhatsApp saat pendaftaran</li>
              <li>Data akun Google (nama, email, foto profil) jika mendaftar via Google OAuth</li>
              <li>Isi pesan, nama pengguna publik, dan foto profil publik Instagram jika Anda menghubungi kami melalui Direct Message akun bisnis @linguo.id (lihat bagian 4)</li>
              <li>Data interaksi dengan platform termasuk jadwal kelas, progress belajar, dan riwayat pembayaran</li>
              <li>Data analitik penggunaan website secara anonim</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">2. Penggunaan Informasi</h2>
            <p>Informasi yang dikumpulkan digunakan untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menyediakan dan mengelola layanan kursus bahasa</li>
              <li>Menghubungi Anda terkait jadwal kelas, pembayaran, dan informasi penting</li>
              <li>Meningkatkan kualitas layanan dan pengalaman pengguna</li>
              <li>Mengirimkan informasi promosi (dengan persetujuan Anda)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">3. Pembagian Data</h2>
            <p>Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak ketiga. Data hanya dibagikan kepada:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pengajar Linguo.id yang relevan dengan kelas Anda</li>
              <li>Penyedia layanan pihak ketiga yang membantu operasional kami (Supabase, Vercel, Xendit, serta Meta Platforms untuk komunikasi Instagram) dengan perjanjian kerahasiaan</li>
              <li>Pihak berwenang jika diwajibkan oleh hukum yang berlaku</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Integrasi Instagram &amp; Platform Meta</h2>
            <p>Kami mengoperasikan akun bisnis Instagram <strong>@linguo.id</strong> dan terhubung dengan Instagram Graph API dari Meta Platforms untuk mengelola pesan layanan pelanggan langsung dari sistem internal kami. Melalui integrasi ini:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Data yang kami terima:</strong> isi pesan (teks dan lampiran) yang Anda kirim ke @linguo.id, ID pengguna berbasis akun (IGSID), nama pengguna publik, foto profil publik, serta stempel waktu pesan.</li>
              <li><strong>Tujuan penggunaan:</strong> semata-mata untuk membaca dan membalas pertanyaan Anda seputar harga kelas, jadwal, pendaftaran, dan dukungan layanan pelanggan lainnya.</li>
              <li><strong>Dasar pemrosesan:</strong> kami hanya memproses data ini apabila Anda lebih dulu menghubungi kami. Kami tidak mengirim pesan yang tidak diminta, massal, maupun promosi tanpa persetujuan Anda.</li>
              <li><strong>Pembagian:</strong> data pesan tidak dijual atau dibagikan ke pihak ketiga di luar penyedia infrastruktur yang tercantum pada bagian 3.</li>
              <li><strong>Penyimpanan &amp; penghapusan:</strong> data pesan disimpan selama diperlukan untuk menangani percakapan Anda dan dapat dihapus atas permintaan sesuai bagian Penghapusan Data.</li>
            </ul>
            <p>Penggunaan data yang diperoleh dari Instagram tunduk pada <a href="https://www.facebook.com/legal/terms/plainlanguage" target="_blank" rel="noopener noreferrer" className="text-[#1A9E9E] hover:underline">Ketentuan Platform Meta</a> dan <a href="https://developers.facebook.com/policy/" target="_blank" rel="noopener noreferrer" className="text-[#1A9E9E] hover:underline">Kebijakan Developer Meta</a>. Untuk memahami bagaimana Meta mengelola data Anda, lihat <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="text-[#1A9E9E] hover:underline">Kebijakan Privasi Instagram</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">5. Keamanan Data</h2>
            <p>Kami menggunakan langkah-langkah keamanan yang wajar untuk melindungi data Anda, termasuk enkripsi data, akses terbatas, dan penyimpanan pada server yang aman.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">6. Hak Anda</h2>
            <p>Anda memiliki hak untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mengakses data pribadi yang kami simpan tentang Anda</li>
              <li>Meminta koreksi data yang tidak akurat</li>
              <li>Meminta penghapusan data pribadi Anda</li>
              <li>Menarik persetujuan penggunaan data kapan saja</li>
            </ul>
            <p>Untuk menggunakan hak-hak tersebut, hubungi kami di <a href="mailto:official.linguo@gmail.com" className="text-[#1A9E9E] hover:underline">official.linguo@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">7. Cookie & Penyimpanan Lokal</h2>
            <p>Kami menggunakan cookie dan penyimpanan lokal browser untuk menyimpan preferensi pengguna dan data sesi login. Anda dapat mengatur penggunaan cookie melalui pengaturan browser.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">8. Penghapusan Data</h2>
            <p>Jika Anda ingin menghapus seluruh data Anda dari sistem kami, silakan kirim email ke <a href="mailto:official.linguo@gmail.com" className="text-[#1A9E9E] hover:underline">official.linguo@gmail.com</a> dengan subjek "Permintaan Penghapusan Data". Kami akan memproses dalam 14 hari kerja.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">9. Perubahan Kebijakan</h2>
            <p>Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">10. Kontak</h2>
            <p>Jika ada pertanyaan mengenai kebijakan privasi ini, hubungi kami:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email: <a href="mailto:official.linguo@gmail.com" className="text-[#1A9E9E] hover:underline">official.linguo@gmail.com</a></li>
              <li>WhatsApp: <a href="https://wa.me/6282116859493" className="text-[#1A9E9E] hover:underline">+62 821-1685-9493</a></li>
              <li>Alamat: Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-center">
          <Link href="/" className="text-sm text-[#1A9E9E] hover:underline">← Kembali ke Beranda</Link>
        </div>
      </main>

      <footer className="bg-slate-50 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} PT. Linguo Edu Indonesia
      </footer>
    </div>
  );
}
