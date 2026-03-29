async function loadCloudLogo() {
  const img = document.getElementById('appLogo');
  const imgB = document.getElementById('appLogoSecondary'); // Jika ada logo kedua

  try {
    const response = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: "getAppSettings"
      })
    });

    const res = await response.json();

    // Jika server membalas dengan sukses
    if (res.status === "success" && res.data) {
      const settings = res.data;
      
      if (img && settings.logo) {
        img.src = settings.logo;
        console.log("🎨 Logo Utama Dimuat: " + settings.logo);
      }
      
      if (imgB && settings.logo_b) {
        imgB.src = settings.logo_b;
      }
    } else {
      throw new Error("Logo tidak ditemukan di database");
    }

  } catch (err) {
    console.error("Gagal memuat logo: ", err);
    
    // Gunakan Placeholder jika gagal agar UI tidak "pecah" (gambar silang)
    if (img) img.src = "https://via.placeholder.com/300x250/000000/FFF?text=Karya+Sahabat+Cemerlang";
    
    Swal.fire({
      title: "Koneksi Lemah",
      text: "Gagal memuat konfigurasi logo dari server.",
      icon: "warning",
      confirmButtonText: "Tetap Masuk",
      width: '80%'
    });
  }
}

/*
async function loadCloudLogo() {
  const img = document.getElementById('appLogo');
  const imgB = document.getElementById('appLogoSecondary'); // Jika ada logo kedua

  try {
    const response = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: "getAppSettings"
      })
    });

    const res = await response.json();

    // Jika server membalas dengan sukses
    if (res.status === "success" && res.data) {
      const settings = res.data;
      
      if (img && settings.logo) {
        img.src = settings.logo;
        console.log("🎨 Logo Utama Dimuat: " + settings.logo);
      }
      
      if (imgB && settings.logo_b) {
        imgB.src = settings.logo_b;
      }
    } else {
      throw new Error("Logo tidak ditemukan di database");
    }

  } catch (err) {
    console.error("Gagal memuat logo: ", err);
    
    // Gunakan Placeholder jika gagal agar UI tidak "pecah" (gambar silang)
    if (img) img.src = "https://via.placeholder.com/300x250/000000/FFF?text=Karya+Sahabat+Cemerlang";
    
    Swal.fire({
      title: "Koneksi Lemah",
      text: "Gagal memuat konfigurasi logo dari server.",
      icon: "warning",
      confirmButtonText: "Tetap Masuk",
      width: '80%'
    });
  }
}

// Jalankan saat startup
loadCloudLogo();
*/

async function loadCloudLogo() {
  const img = document.getElementById('appLogo');
  const imgB = document.getElementById('appLogoSecondary');

  // 1. Set logo lokal sebagai default (Agar tidak kosong saat loading)
  if (img) img.src = "./asset/logo/PT-KSC.png"; 

  try {
    // 2. Tambahkan mode: 'no-cors' atau redirect: 'follow' untuk jalur /dev
    const response = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      mode: 'cors', // Penting agar header autentikasi Google terbaca
      redirect: 'follow', // WAJIB untuk jalur /dev karena ada pengalihan internal Google
      body: JSON.stringify({
        action: "getAppSettings"
      })
    });

    const res = await response.json();

    if (res.status === "success" && res.data) {
      const settings = res.data;
      if (img && settings.logo) {
        img.src = settings.logo;
        console.log("🎨 Logo Utama Dimuat dari Cloud: " + settings.logo);
      }
      if (imgB && settings.logo_b) {
        imgB.src = settings.logo_b;
      }
    }

  } catch (err) {
    // 3. Jika gagal, biarkan logo tetap di jalur lokal, tidak perlu Swal error terus-terusan
    console.warn("⚠️ Mode Dev: Gagal ambil logo Cloud, pakai logo lokal saja.", err);
    
    // Pastikan path lokal benar jika di atas tadi belum terpasang
    if (img && !img.src.includes('PT-KSC.png')) {
       img.src = "./asset/logo/PT-KSC.png";
    }
  }
}

loadCloudLogo();