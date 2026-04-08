
/**
 * JEMBATAN SERVER: Namanya sama ama di GAS biar gak pusing
 * Cara pakai: const jam = await getServerTime();
 * JEMBATAN SERVER: Sinkronisasi Waktu
 */
async function getServerTime(dateform = null) {
  try {
    // 1. Mode Formatter (Lokal): Jika ada tanggal masuk, format jadi DD/MM/YYYY HH:mm:ss
    if (dateform) {
      const targetDate = new Date(dateform);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${pad(targetDate.getDate())}/${pad(targetDate.getMonth()+1)}/${targetDate.getFullYear()} ${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}:${pad(targetDate.getSeconds())}`;
    }

    // 2. Mode Real-time (Server): Panggil via GET (doGet)
    // Sesuai kode doGet kamu sebelumnya, action-nya adalah "getTime"
    //const resp = await fetch(`${APPSCRIPT_URL}?action=getTime`);
    //const res = await resp.json();
    
    res = await panggilGAS("getTime",{
        kirimkegithub:false
      }
    )
    //console.log("Respon getTime:", res);

    if (res.status === "success") {
      return res.time;
    } else {
      throw new Error(res.message);
    }

  } catch (err) {
    console.warn("Gagal ambil jam server, pakai jam lokal:", err);
    // Fallback: Format jam lokal agar mirip format server kamu
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${now.getMinutes()}:${now.getSeconds()}`;
  }
}






/**
 * [FUNGSI CLIENT GITHUB: AMBIL TANGGAL SERVER]
 * Mengambil string waktu dari doGet(?action=getServerTime)
 */
async function getMMDDYY() {
  //const iframe = document.getElementById('iframeGAS');
  const urlGAS = APPSCRIPT_URL;

  try {
    // 1. Fetch ke server
    const response = await fetch(`${urlGAS}?action=getServerTime`);
    const fullTime = await response.json(); // Hasilnya: "19/02/2024 14:30:05"

    // 2. Bedah string menjadi "190224"
    const parts = fullTime.split(' ')[0].split('/'); 
    const dd = parts[0];
    const mm = parts[1];
    const yy = parts[2].slice(-2);

    return dd + mm + yy; 

  } catch (err) {
    console.error("Gagal ambil waktu server, menggunakan waktu lokal:", err);
    // Fallback: Waktu Lokal jika internet gangguan
    const d = new Date();
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const yy = d.getFullYear().toString().slice(-2);
    return dd + mm + yy;
  }
}
