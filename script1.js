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
    const dataArray = [
          asId, "", 
          document.getElementById('as_nama').value,
          document.getElementById('as_lokasi').value,
          document.getElementById('as_status').value
        ]
    prepayload = {asId: asId,
        type: type,
        row: row,
        qrBase64: qrTeksMurni,
        allFiles: fotoWebP} ;
        
    const res = await panggilGAS("saveAssetEnterpriseWithQR", {     
        prepayload,
        userData:dataArray,
        kirimgithub: false // Backup otomatis
      
    });
    //console.table(payload);
    console.log("Cek Respon:", res);

    if (res && res.status === "success") {
      // --- STEP 4: SUKSES (Buka Kunci) ---
      await Swal.fire({
        icon: "success",
        title: "Berhasil Disimpan",
        text: res.data || "Data dan Foto berhasil diperbarui.",
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