/**
 * VERSI RAM: Ambil Detail Unit + Cek Jadwal (Tanpa Fetch/Server)
 * @param {string} unitID - ID Unit yang dicari
 */

function getAssetDetailForLogRAM(unitID) {
  const targetID = String(unitID).trim().toLowerCase();
  
  // 1. Inisialisasi Result Awal
  let result = { 
    nama: "TIDAK DITEMUKAN", 
    status: "error",
    serverTime: window.APP_STORE ? window.APP_STORE.lastSync : "-" // fallback jika APP_STORE kosong
  };

  // 2. SISIR DATA ASSET menggunakan SHEETS.ASSET (12 Type)
  let foundAsset = null;

  // Kita gunakan .find() pada SHEETS.ASSET agar efisien (berhenti jika ketemu)
  SHEETS.ASSET.find(typeName => {
    const rows = ambilDataSheet('ASSET', typeName).slice(1);
    const match = rows.find(r => String(r[0]).trim().toLowerCase() === targetID);

    if (match) {
      foundAsset = {
        asId: String(match[0]),
        type: typeName,
        nama: String(match[2]),   // Kolom C
        lokasi: String(match[3]), // Kolom D
        status: "success"
      };
      return true; // Berhenti mencari di sheet lain
    }
    return false;
  });

  // 3. CEK JADWAL MAINTENANCE
  if (foundAsset) {
    result = { ...result, ...foundAsset };
    
    // Ambil data maintenance
    //const mData = getMaint("Maintenance").slice(1); // Potong header
    const mData = ambilDataSheet("MAINT", "Maintenance").slice(1); // Potong header
    
    //const skrg = new Date();
    // 1. Ambil teks dari serverClock
    const currentStr = document.getElementById('serverClock').innerText; 
    // Contoh isi: "Rabu 08/04/2026, 17:15:57"

    // 2. Bedah string untuk mengambil Tanggal dan Jam saja
    // Kita hapus nama hari dan koma agar formatnya jadi "08/04/2026 17:15:57"
    const cleanStr = currentStr.split(' ').slice(1).join(' ').replace(',', '');

    // 3. Pecah menjadi bagian-bagian (08, 04, 2026, 17, 15, 57)
    const parts = cleanStr.match(/\d+/g); 
    const d = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1; // Bulan di JS mulai dari 0
    const y = parseInt(parts[2]);
    const hh = parseInt(parts[3]);
    const mm = parseInt(parts[4]);
    const ss = parseInt(parts[5]);

    // 4. Buat objek Date baru (Ganti 'const skrg = new Date()' dengan ini)
    const skrg = new Date(y, m, d, hh, mm, ss);

    const rangeMilli = 14 * 24 * 60 * 60 * 1000; // 2 Minggu

    const openJadwal = mData.filter(r => {
      const dbAsId = String(r[2]).trim().toLowerCase(); // Kolom C
      const dbStatus = String(r[9]).trim();             // Kolom J

      if (dbAsId === targetID && dbStatus === "Open") {
        // Parsing Tanggal dd/mm/yyyy
        const parts = String(r[7]).split("/"); // Kolom H
        const planDate = new Date(parts[2], parts[1] - 1, parts[0]);
        
        // Cek range +/- 14 hari
        return (planDate >= new Date(skrg.getTime() - rangeMilli) &&
                planDate <= new Date(skrg.getTime() + rangeMilli));
      }
      return false;
    });

    result.openJadwal = openJadwal.map(r => ({
      maintId: r[0],   // Kolom A
      idJadwal: r[10]  // Kolom K
    }));
  }

  return result;
}


/*
function getAssetDetailForLogRAM(unitID) {
  const targetID = String(unitID).trim().toLowerCase();
  
  // 1. Ambil Jam Sync Terakhir sebagai ServerTime (Sudah ada di RAM)
  let result = { 
    nama: "TIDAK DITEMUKAN", 
    status: "error",
    serverTime: window.APP_STORE.lastSync 
  };

  // 2. SISIR DATA ASSET (Direct Access ke RAM)
  const assetTypes = Object.keys(window.APP_STORE.assets);

  let foundAsset = null;

  for (let typeName of assetTypes) {
    const rows = window.APP_STORE.assets[typeName];
    // Cari di Kolom A (index 0)
    const match = rows.find(r => String(r[0]).trim().toLowerCase() === targetID);

    if (match) {
      foundAsset = {
        asId: String(match[0]),
        type: typeName,
        nama: String(match[2]),   // Kolom C
        lokasi: String(match[3]), // Kolom D
        status: "success"
      };
      break;
    }
  }

  // 3. CEK JADWAL MAINTENANCE (Direct Access ke RAM)
  if (foundAsset) {
    result = { ...result, ...foundAsset };
    //const mData = window.APP_STORE.maintenance["Maintenance"] || [];

    const mData = getMaint("Maintenance");
    
    const skrg = new Date();
    const rangeMilli = 14 * 24 * 60 * 60 * 1000; // 2 Minggu

    // Filter Jadwal Langsung di RAM
    const openJadwal = mData.filter((r, idx) => {
      if (idx === 0) return false; // Lompati header
      
      const dbAsId = String(r[2]).trim().toLowerCase(); // Kolom C
      const dbStatus = String(r[9]).trim();             // Kolom J (State)

      if (dbAsId === targetID && dbStatus === "Open") {
        // Parsing Tanggal (Format dd/mm/yyyy di Spreadsheet)
        const parts = String(r[7]).split("/"); // Kolom H
        const planDate = new Date(parts[2], parts[1] - 1, parts[0]);
        
        return (planDate >= new Date(skrg.getTime() - rangeMilli) &&
                planDate <= new Date(skrg.getTime() + rangeMilli));
      }
      return false;
    });

    result.openJadwal = openJadwal.map(r => ({
      maintId: r[0],   // Kolom A
      idJadwal: r[10]  // Kolom K
    }));
  }

  return result;
}
*/
/**
 * SEARCH ASSET RAM: Pengganti searchAllAssetsGo (GAS)
 * @param {string} keyword - ID Asset atau kata kunci (dari data[6])
 */

function searchAssetRAM(keyword) {
  if (!keyword) return [];

  const searchKey = String(keyword).toLowerCase().trim();
  
  // 1. Gunakan reduce untuk menyisir ke-12 tipe sheet secara dinamis
  const results = SHEETS.ASSET.reduce((hasil, sheetName) => {
    const rows = ambilDataSheet('ASSET', sheetName);
    if (!rows) return hasil;

    // 2. Mulai dari index 1 (Lompati Header)
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i];
      const cellID = String(rowData[0]).toLowerCase().trim(); // Kolom A (ID)
      const allText = rowData.join(" ").toLowerCase();       // Gabungan semua kolom

      // LOGIKA: Cocok ID persis ATAU ada kata kunci di baris tersebut
      if (cellID === searchKey || allText.indexOf(searchKey) > -1) {
        hasil.push({
          type:   sheetName,
          row:    i + 1,       // Baris asli di Spreadsheet
          id:     rowData[0],  // Kolom A
          nama:   rowData[2],  // Kolom C
          lokasi: rowData[3],  // Kolom D
          status: rowData[4]   // Kolom E
        });
      }
    }
    return hasil;
  }, []);

  return results;
}



/*
function searchAssetRAM(keyword) {
  if (!keyword) return [];

  const searchKey = String(keyword).toLowerCase().trim();
  let results = [];
  
  // Ambil semua tipe sheet yang ada di RAM
  const assetTypes = Object.keys(window.APP_STORE.assets);

  assetTypes.forEach(sheetName => {
    const rows = window.APP_STORE.assets[sheetName];
    
    // Mulai dari index 1 (Lompati Header)
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i];
      const cellID = String(rowData[0]).toLowerCase().trim(); // Kolom A (ID)
      const allText = rowData.join(" ").toLowerCase();       // Gabungan semua kolom

      // LOGIKA: Cocok ID persis ATAU ada kata kunci di baris tersebut
      if (cellID === searchKey || allText.indexOf(searchKey) > -1) {
        results.push({
          type:   sheetName,
          row:    i + 1,       // Baris asli di Spreadsheet
          id:     rowData[0],  // Kolom A
          nama:   rowData[2],  // Kolom C
          lokasi: rowData[3],  // Kolom D
          status: rowData[4]   // Kolom E
        });
      }
    }
  });

  return results;
}
  */


