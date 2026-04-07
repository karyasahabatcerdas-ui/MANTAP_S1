async function saveAssetEdit() {
  const asId = document.getElementById('as_id').value;
  const type = document.getElementById('as_type').value;
  const row = document.getElementById('assetRowIdx').value;

  if (!asId) { 
    Swal.fire({ title: "ID Kosong", icon: "warning", background: "#0f172a", color: "#fff" });
    return; 
  }

  // --- STEP 1: KUNCI LAYAR TOTAL ---
  Swal.fire({
    title: 'Memproses Data...',
    html: '<div id="swal-label-save">Menyiapkan QR & Kompresi...</div>',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const label = document.getElementById('swal-label-save');

    // --- STEP 2: PROSES LOKAL (QR & KOMPRESI) ---
    const qrTeksMurni = await generateCustomQR(type + "-" + asId); 
    
    let fotoWebP = [];
    if (temp_Asset_Files && temp_Asset_Files.length > 0) {
      if (label) label.innerText = "Mengompres Foto ke WebP...";
      fotoWebP = await Promise.all(temp_Asset_Files.map(file => compressToWebP(file, 0.75)));
    }

    // --- STEP 3: KIRIM KE GAS ---
    if (label) label.innerText = "Mengunggah & Sinkronisasi Cloud...";

    const res = await panggilGAS("saveAssetEnterpriseWithQR", {     
        dataLoad: {
            asId: asId,
            type: type,
            row: row,
            qrBase64: qrTeksMurni,
            allFiles: fotoWebP
        },
        dataArray:[
          asId, "", 
          document.getElementById('as_nama').value,
          document.getElementById('as_lokasi').value,
          document.getElementById('as_status').value
        ],
        kirimgithub: false // Backup otomatis
      
    });
    //console.table(payload);
    console.log("Cek Respon:", res);

    if (res && res.status === "success") {
      // --- STEP 4: SUKSES (Buka Kunci) ---
      await Swal.fire({
        icon: "success",
        title: "Berhasil Disimpan",
        text: res.data.message || "Data dan Foto berhasil diperbarui.",
        background: "#0f172a", color: "#fff"
      });

      // Reset & Refresh UI
      temp_Asset_Files = []; 
      if (typeof closeAssetModal === 'function') closeAssetModal();
      if (typeof loadAssetData === 'function') loadAssetData(type); 

    } else {
      throw new Error(res ? res.message : "Server tidak merespons.");
    }

  } catch (err) {
    // --- STEP 5: ERROR (Buka Kunci & Lapor) ---
    console.error("Save Error:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal Simpan",
      text: err.message,
      background: "#0f172a", color: "#fff"
    });
  }
}

/**
 * FUNGSI UTAMA: Sinkronisasi Massal dengan Multi-Port (Max 6 Sesi)
 */
async function initialSyncAllParallel() {
  // 1. Kumpulkan semua Nama Sheet dari konstanta SHEETS kamu
  const assetKeys = Object(SHEETS.ASSET);
  const maintKeys = Object(SHEETS.MAINT);
  const selectKeys = Object(SHEETS.SELECT);
  
  const allTasks = [
    ...assetKeys.map(name => ({ group: 'ASSET', name })),
    ...maintKeys.map(name => ({ group: 'MAINT', name })),
    ...selectKeys.map(name => ({ group: 'SELECT', name }))
  ];

  let finished = 0;
  const total = allTasks.length;

  // 2. Tampilkan UI Loading yang informatif
  Swal.fire({
  title: 'SYNCING VAULT',
  html: `
    <div id="sync-msg" style="margin-bottom:15px; color: #94a3b8; font-size: 13px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">
      Inisialisasi Port Data...
    </div>
    <div style="width: 100%; background: #334155; border-radius: 4px; overflow: hidden; height: 20px; border: 1px solid #475569;">
      <div id="sync-bar" style="width: 0%; height: 100%; background: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); transition: width 0.4s ease-out; position: relative;">
        <div id="sync-pct" style="position: absolute; width: 100%; text-align: center; color: #1e293b; font-size: 11px; line-height: 20px; font-weight: 800;">
          0%
        </div>
      </div>
    </div>
  `,
  background: '#1e293b',         // Dark Background (Sesuai tema kamu)
  color: '#f8fafc',              // White Text
  iconHtml: '<i class="fas fa-sync-alt fa-spin"></i>', // Optional: Icon putar kalau pakai FontAwesome
  iconColor: '#f59e0b',          // Amber/Gold
  width: '85%',
  padding: '1.5rem',
  allowOutsideClick: false,
  showConfirmButton: false,
  customClass: {
    popup: 'border-neon-amber'   // Kamu bisa buat CSS .border-neon-amber { border: 1px solid #f59e0b; }
  },
  didOpen: () => {
    // Menghilangkan default loader Swal agar fokus ke progress bar buatan kita
    const loader = document.querySelector('.swal2-loader');
    if (loader) loader.style.display = 'none';
  }
});

  try {
    // 3. Eksekusi dengan Pool Limit (Maksimal 6 Sesi Simultan)
    const poolLimit = 6;
    await asyncPool(poolLimit, allTasks, async (task) => {
      
      // Ambil data dengan fitur Auto-Retry
      const res = await fetchWithRetry(task.group, task.name, 3);
      
      if (res && res.status === "success") {
        // Rekonstruksi ke Vault di RAM (Global Variable)
        if (!Vault[task.group]) Vault[task.group] = {};
        Vault[task.group][task.name] = res.data; // Simpan data terenkripsi XOR

        // Update Progress Bar secara Real-time
        finished++;
        const pct = Math.round((finished / total) * 100);
        updateSyncUI(pct, `Mendarat: ${task.name}`);
      }
    });

    // 4. SELESAI
    console.log("✅ Vault Synchronized:");
    //Swal.fire({ icon: 'success', title: 'Vault Terkunci!', text: `${total} database aman di RAM.`, timer: 1500, showConfirmButton: false });

    Swal.fire({
    icon: 'success',
    title: 'VAULT TERKUNCI!',
    text: `${total} Database berhasil sinkron ke RAM.`,
    background: '#102342ff',         // Dark Background
    color: '#f8fafc',              // White Text
    iconColor: '#f59e0b',          // Amber/Gold (Sesuai tema kamu)
    confirmButtonColor: '#f59e0b', // Tombol Amber
    confirmButtonText: 'LANJUTKAN',
    timer: 2000,
    timerProgressBar: true,        // Garis waktu di bawah (opsional, keren lho!)
    customClass: {
        popup: 'border-neon-amber'
    }
    });

  } catch (error) {
    console.error("Critical Sync Error:", error);
    //Swal.fire('Sync Gagal!', 'Terjadi masalah pada salah satu port. Cek Console.', 'error');

    Swal.fire({
    icon: 'error',
    title: 'SYNC GAGAL!',
    text: 'Terjadi masalah pada salah satu port data. Silakan cek Console (F12).',
    background: '#1e293b',
    color: '#f8fafc',
    iconColor: '#ef4444',          // Merah Terang
    confirmButtonColor: '#334155', // Tombol Slate (Neutral)
    confirmButtonText: 'OKE, PAHAM',
    customClass: {
        popup: 'border-neon-red'
    }
    });
  }
}

/**
 * FUNGSI PEMBANTU: Kurir dengan Fitur Retry (Tanpa ubah panggilGAS)
 */
async function fetchWithRetry(group, sheetName, maxRetries) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Mengirim payload yang sesuai dengan 'doPost' kamu
      //const response = await panggilGAS("readSheetDirect", { 
     //   payload: { group: group, sheetName: sheetName } 
     // });

      const response = await panggilGAS("readSheetDirect", { 
        group: group, 
        sheetName: sheetName,
        kirimgithub: false
      });
      //console.log("respon dari fetch", response)
      return response;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.warn(`Retry Port [${sheetName}] ke-${i+1}...`);
      await new Promise(r => setTimeout(r, 1500)); // Jeda 1.5 detik sebelum coba lagi
    }
  }
}

/**
 * FUNGSI PEMBANTU: Pengatur Lalu Lintas Sesi (Concurrency)
 */
async function asyncPool(limit, array, fn) {
  const promises = [];
  const executing = new Set();
  for (const item of array) {
    const p = fn(item);
    promises.push(p);
    executing.add(p);
    p.then(() => executing.delete(p));
    if (executing.size >= limit) {
      await Promise.race(executing); 
    }
  }
  return Promise.all(promises);
}

/**
 * FUNGSI PEMBANTU: Update Tampilan Bar
 */
function updateSyncUI(pct, msg) {
  const bar = document.getElementById('sync-bar');
  const text = document.getElementById('sync-msg');
  const pctText = document.getElementById('sync-pct');
  if (bar) {
    bar.style.width = pct + "%";
    bar.innerText = pct + "%";
  }
  if (pctText) pctText.innerText = pct + "%";
  if (text) text.innerText = msg;
}


