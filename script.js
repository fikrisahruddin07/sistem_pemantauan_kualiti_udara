// URL API Open-Meteo dengan parameter yang diminta
const API_URL = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=3.14&longitude=101.69&hourly=us_aqi";

const statusEl = document.getElementById('api-status');
const totalSamplesEl = document.getElementById('total-samples');
const avgAqiEl = document.getElementById('avg-aqi');

async function fetchAirQualityData() {
    try {
        // Tampilkan status memuatkan
        statusEl.innerText = "Sedang Memuatkan...";
        statusEl.style.backgroundColor = "#f39c12";

        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Gagal menyambung ke API');
        }

        const data = await response.json();
        
        // Pemprosesan Data: Ekstrak 24 data pertama
        const timesRaw = data.hourly.time.slice(0, 24);
        const aqiValues = data.hourly.us_aqi.slice(0, 24);

        // Format tarikh ke bentuk mesra pengguna (Contoh: 07 May)
       const formattedLabels = timesRaw.map(timeStr => {
    const date = new Date(timeStr);
    // Ini akan memaparkan Jam dan Minit (cth: 14:00) diikuti tarikh
    const masa = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const tarikh = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return `${masa}, ${tarikh}`; 
});

        // Pengiraan Purata AQI
        const sumAqi = aqiValues.reduce((a, b) => a + b, 0);
        const averageAqi = (sumAqi / aqiValues.length).toFixed(1);

        // Kemaskini Antaramuka (UI)
        totalSamplesEl.innerText = aqiValues.length;
        avgAqiEl.innerText = averageAqi;
        
        statusEl.innerText = "Data Sedia Dipaparkan";
        statusEl.style.backgroundColor = "#27ae60";

        // Bina Carta
        renderChart(formattedLabels, aqiValues);

    } catch (error) {
        console.error("Ralat API:", error);
        statusEl.innerText = "Kegagalan Sambungan";
        statusEl.style.backgroundColor = "#e74c3c";
    }
}

function renderChart(labels, dataValues) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nilai AQI (US AQI)',
                data: dataValues,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3 // Membuatkan garis lebih melengkung/smooth
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Masa / Tarikh'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nilai AQI'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

// Jalankan fungsi fetch semasa halaman dimuatkan
fetchAirQualityData();