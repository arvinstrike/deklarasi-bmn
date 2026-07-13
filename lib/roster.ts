import type { EventInfo } from './types'

/**
 * Roster Setjen DPR RI — pejabat Eselon I & II. Urutan: 4 pertama = Eselon I.
 * Foto ada di /public/foto. `token` = tautan unik per pejabat (nanti dipakai WA).
 * ponytail: satu array = sumber kebenaran roster; state konfirmasi ada di store.
 */
export const ROSTER: {
  name: string
  position: string
  photo: string
  token: string
}[] = [
  { name: 'Suprihartini, S.IP., M.Si', position: 'Deputi Bidang Persidangan', photo: '/foto/Suprihartini, S.IP., M.Si 197101061990032001.jpg.jpeg', token: 'k7m2qh9x' },
  { name: 'Rahmad Budiaji', position: 'Deputi Bidang Administrasi', photo: '/foto/01 Rahmad Budiaji 197008011996031001.jpg.jpeg', token: 'p3v8ct1w' },
  { name: 'Prof. Dr. Bayu Dwi Anggono, S.H., M.H.', position: 'Kepala Badan Keahlian', photo: '/foto/Prof. Dr. Bayu Dwi Anggono, S.H., M.H.  198206232005011002.jpg.jpeg', token: 'z9n4rb6k' },
  { name: 'Drs. Rusdi Hartono, M.Si.', position: 'Inspektur Utama', photo: '/foto/Komjen (Pol). Drs. Rusdi Hartono, M.Si. 69040341.jpg.jpeg', token: 'd5t7wm2q' },
  { name: 'Dr. Wiwin Sri Rahyani, S.H., M.H.', position: 'Kepala Pusat Perancangan Undang-Undang Bidang Ekonomi, Keuangan, Industri, Pembangunan, dan Kesejahteraan Rakyat', photo: '/foto/Dr. Wiwin Sri Rahyani, S.H., M.H. 197901192002122002.jpg.jpeg', token: 'f8h3xj5v' },
  { name: 'Dr. M. Najib Ibrahim, S.Ag., M.H.', position: 'Kepala Biro Pemberitaan Parlemen', photo: '/foto/Dr. M. Najib Ibrahim, S.Ag., M.H. 197202292002121001.jpg.jpeg', token: 'r2c9bn4t' },
  { name: 'Rudi Rochmansyah, S.H., M.H.', position: 'Kepala Biro Protokol dan Hubungan Masyarakat', photo: '/foto/Rudi Rochmansyah, S.H., M.H. 196902131993021001.jpg.jpeg', token: 'm6k1qw8z' },
  { name: 'Dr. Asep Ahmad Saefuloh, S.E., M.Si., QGIA. QIA', position: 'Inspektur I', photo: '/foto/Dr. Asep Ahmad Saefuloh, S.E., M.Si., QGIA. QIA 197109111997031005.jpg.jpeg', token: 'w4v7hd3n' },
  { name: 'Dr. Indra Pahlevi, S.IP., M.Si.', position: 'Kepala Biro Keuangan', photo: '/foto/Dr. Indra Pahlevi, S.IP., M.Si. 197111171998031004.jpg.jpeg', token: 'j9b5tc2m' },
  { name: 'Dr. Lidya Suryani Widayati, S.H., M.H.', position: 'Kepala Biro Hukum dan Pengaduan Masyarakat', photo: '/foto/Dr. Lidya Suryani Widayati, S.H., M.H. 197004291998032001.jpg.jpeg', token: 'x3q8kf6w' },
  { name: 'Novianto Murti Hantoro, S.H., M.H.', position: 'Kepala Pusat Perancangan Undang-Undang Bidang Politik, Hukum, dan Hak Asasi Manusia', photo: '/foto/Novianto Murti Hantoro, S.H., M.H. 197111111996031001.jpg.jpeg', token: 'h7n2vb9k' },
  { name: 'Achmad Sani Alhusain, S.E., M.A.', position: 'Kepala Biro Pengelolaan Bangunan dan Wisma', photo: '/foto/Achmad Sani Alhusain, S.E., M.A. 197205111999031003.jpg.jpeg', token: 'c1w6md4t' },
  { name: 'Erdinal Hendradjaja, ST., M.Sc.', position: 'Kepala Pusat Teknologi Informasi', photo: '/foto/Erdinal Hendradjaja, ST., M.Sc. 198008132009121001.jpg.jpeg', token: 'v8k3qb7n' },
  { name: 'Arini Wijayanti, S.H., M.H.', position: 'Kepala Biro Persidangan I', photo: '/foto/Arini Wijayanti, S.H., M.H. 197105181998032010.jpg.jpeg', token: 'b5t9wh2x' },
  { name: 'Endang Suryastuti, S.H., M.Si.', position: 'Kepala Biro Sumber Daya Manusia Aparatur', photo: '/foto/Endang Suryastuti, S.H., M.Si. 196908011994032001.jpg.jpeg', token: 'n4m7cd1v' },
  { name: 'Dr. Furcony Putri Syakura, S.H., M.H., M.Kn., QGIA, QHIA., QIA, PQIA', position: 'Kepala Pusat Analisis Anggaran dan Akuntabilitas Keuangan Negara', photo: '/foto/Dr. Furcony Putri Syakura, S.H., M.H., M.Kn., QGIA, QHIA., QIA, PQIA 196811251993022001.jpg.jpeg', token: 'q2b8kw5h' },
  { name: 'Chairil Patria, S.IP., M.Si.', position: 'Kepala Pusat Analisis Keparlemenan', photo: '/foto/Chairil Patria, S.IP., M.Si. 197111051998031002.jpg.jpeg', token: 't6v1nc9m' },
  { name: 'Djustiawan Widjaya, S.Sos., M.A.P.', position: 'Kepala Biro Persidangan II', photo: '/foto/Djustiawan Widjaya, S.Sos., M.A.P. 197007061998031005.jpg.jpeg', token: 'k9h4wb3t' },
  { name: 'Dian Arivani, S.E., M.S.M.', position: 'Kepala Biro Kesekretariatan Pimpinan', photo: '/foto/Dian Arivani, S.E., M.S.M. 198209082005022001.jpg.jpeg', token: 'w7c2md8v' },
  { name: 'Dewi Pusporini, S.T., M.E.', position: 'Kepala Biro Perencanaan dan Organisasi', photo: '/foto/Dewi Pusporini, S.T., M.E. 197412111999032005.jpg.jpeg', token: 'x5k8qh1n' },
  { name: 'Waluyo, S.E, M.AP', position: 'Kepala Biro Umum', photo: '/foto/Waluyo, S.E, M.AP 197405271998031004.jpg.jpeg', token: 'm3b6wt4c' },
  { name: 'Satyanto Priambodo, S.E., M.Si., QIA', position: 'Inspektur II', photo: '/foto/Satyanto Priambodo, S.E., M.Si., QIA 196610081994031003.jpg.jpeg', token: 'h8v5nk2w' },
  { name: 'Aulia Sofyan, Ph.D.', position: 'Kepala Pusat Pengembangan Kompetensi Sumber Daya Manusia Legislatif', photo: '/foto/Aulia Sofyan, Ph.D. 197210181992031002.jpg.jpeg', token: 'c4t7wb9h' },
  { name: 'Rijal Al Huda, M.Ec.', position: 'Kepala Biro Kerja Sama Antar Parlemen dan Organisasi Internasional', photo: '/foto/Rijal Al Huda, M.Ec. 197709092002121001.jpg.jpeg', token: 'q6m1kd5t' },
]

export const EVENT: EventInfo = {
  title: 'Komitmen Bersama Pengelolaan Keuangan dan BMN',
  subtitle: 'Sekretariat Jenderal Dewan Perwakilan Rakyat Republik Indonesia',
  location: 'Ruang KK II',
  date: '2026-08-17',
  locked: false,
}
