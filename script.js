// 1. Konfigurasi API (Mengikut format profesional image_c00d3f.png)
const API_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const params = new URLSearchParams({
    latitude: 3.14,
    longitude: 101.69,
    hourly: 'us_aqi',
    timezone: 'Asia/Kuala_Lumpur' 
});

const API_URL = `${API_BASE_URL}?${params.toString()}`;

// 2. Rujukan Elemen UI
const statusEl = document.getElementById('api-status');
const totalSamplesEl = document.getElementById('total-samples');
const avgAqiEl = document.getElementById('avg-aqi');

// 3. Fungsi Utama untuk Mengambil dan Menapis Data
async function fetchAirQualityData() {
    try {
        statusEl.innerText = "Sedang Memuatkan...";
        statusEl.style.backgroundColor = "#f39c12";

        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Gagal menyambung ke API');
        }

        const data = await response.json();
        
        // GABUNG & TAPIS: Ambil 24 jam pertama, tapi buang waktu MALAM (7 mlm - 11 mlm)
        const allData = data.hourly.time.slice(0, 24).map((t, index) => ({
            time: t,
            value: data.hourly.us_aqi[index]
        }));

        // Logik Penapisan: Hanya jam 0 (12 am) hingga 18 (6 pm)
        const filteredData = allData.filter(item => {
            const hour = new Date(item.time).getHours();
            return hour >= 0 && hour < 19; // Membuang jam 19:00 ke atas (malam)
        });

        // Ekstrak data yang telah ditapis untuk carta
        const timesRaw = filteredData.map(d => d.time);
        const aqiValues = filteredData.map(d => d.value);

        // Format Label: Tukar ke format 12 jam dengan penanda 'pg' atau 'ptg'
        const formattedLabels = timesRaw.map(timeStr => {
            const date = new Date(timeStr);
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            // Penentuan tempoh (Malam sudah dibuang dalam filter di atas)
            let tempoh = (hours < 12) ? "pg" : "ptg";
            const displayHour = hours % 12 || 12; 

            return `${displayHour}:${minutes} ${tempoh}`;
        });

        // Pengiraan Statistik Siang
        const sumAqi = aqiValues.reduce((a, b) => a + b, 0);
        const averageAqi = aqiValues.length > 0 ? (sumAqi / aqiValues.length).toFixed(1) : 0;

        // Kemaskini UI
        totalSamplesEl.innerText = aqiValues.length;
        avgAqiEl.innerText = averageAqi;
        
        statusEl.innerText = "Data Berjaya Dimuatkan";
        statusEl.style.backgroundColor = "#27ae60";

        // Paparkan Carta
        renderChart(formattedLabels, aqiValues);

    } catch (error) {
        console.error("Ralat API:", error);
        statusEl.innerText = "Kegagalan Sambungan";
        statusEl.style.backgroundColor = "#e74c3c";
    }
}

// 4. Fungsi Render Carta (Chart.js)
function renderChart(labels, dataValues) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    
    // Musnahkan carta lama jika ada (untuk elak ralat bertindih semasa refresh)
    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nilai AQI (Pagi & Petang)',
                data: dataValues,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Penting untuk fungsi scroll di mobile
            scales: {
                x: {
                    title: { display: true, text: 'Masa' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Nilai AQI' }
                }
            }
        }
    });
}

// 5. Jalankan Aplikasi
fetchAirQualityData();