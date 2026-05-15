// 1. Konfigurasi API
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


// 3. Fungsi Utama
async function fetchAirQualityData() {

    try {

        statusEl.innerText = "Sedang Memuatkan...";
        statusEl.style.backgroundColor = "#f39c12";

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error('Gagal menyambung ke API');
        }

        const data = await response.json();

        // Ambil 24 jam data
        const allData = data.hourly.time.slice(0, 24).map((t, index) => ({
            time: t,
            value: data.hourly.us_aqi[index]
        }));


        // Tapis waktu malam
        const filteredData = allData.filter(item => {

            const hour = new Date(item.time).getHours();

            return hour >= 0 && hour < 19;

        });


        // Data untuk chart
        const timesRaw = filteredData.map(d => d.time);

        const aqiValues = filteredData.map(d => d.value);


        // Format label masa
        const formattedLabels = timesRaw.map(timeStr => {

            const date = new Date(timeStr);

            let hours = date.getHours();

            const minutes = date.getMinutes()
                .toString()
                .padStart(2, '0');

            const tempoh = hours < 12 ? 'pg' : 'ptg';

            const displayHour = hours % 12 || 12;

            return `${displayHour}:${minutes} ${tempoh}`;

        });


        // Statistik
        const sumAqi = aqiValues.reduce((a, b) => a + b, 0);

        const averageAqi =
            aqiValues.length > 0
                ? (sumAqi / aqiValues.length).toFixed(1)
                : 0;


        // Update UI
        totalSamplesEl.innerText = aqiValues.length;

        avgAqiEl.innerText = averageAqi;

        statusEl.innerText = "Data Berjaya Dimuatkan";

        statusEl.style.backgroundColor = "#27ae60";


        // Render chart
        renderChart(
            formattedLabels,
            aqiValues,
            timesRaw
        );

    }

    catch (error) {

        console.error("Ralat API:", error);

        statusEl.innerText = "Kegagalan Sambungan";

        statusEl.style.backgroundColor = "#e74c3c";
    }
}



// 4. Fungsi Render Chart
function renderChart(labels, dataValues, timesRaw) {

    const ctx =
        document
            .getElementById('aqiChart')
            .getContext('2d');


    // Buang chart lama
    if (window.myChart) {
        window.myChart.destroy();
    }


    // Buat chart baru
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nilai AQI (Pagi & Petang)',
                data: dataValues,
                borderColor: '#60A5FA',
                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#60A5FA',
                pointBorderColor: '#60A5FA',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                tooltip: {
                    callbacks: {
                        title: function (context) {
                            const index = context[0].dataIndex;
                            const rawTime = timesRaw[index];
                            const date = new Date(rawTime);

                            const tarikh = date.toLocaleDateString('ms-MY', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            });

                            const masa = date.toLocaleTimeString('ms-MY', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            return `${tarikh}, ${masa}`;
                        },

                        label: function (context) {
                            return `Nilai AQI (Pagi & Petang): ${context.raw}`;
                        }
                    }
                }
            },

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
    // 5. Jalankan App
    fetchAirQualityData();