document.addEventListener('DOMContentLoaded', function() {
    const apiKey = 'cff3c04f08d45e39e6889c9162793ba2'; // OpenWeather API Key

    // DOM Elements
    const searchButton = document.getElementById('search-button');
    const searchBar = document.getElementById('search-bar');
    const unitToggle = document.getElementById('unit-toggle');
    const weatherDataDiv = document.getElementById('weather-data');
    const weatherTable = document.getElementById('weather-table');
    const dashboardSection = document.getElementById('dashboard-section');
    const tablesSection = document.getElementById('tables-section');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const tablesBtn = document.getElementById('tables-btn');

    // Chart instances
    let barChart, doughnutChart, lineChart;

    // Fetch Weather Data for a specific city
    async function fetchWeather(city) {
        const unit = unitToggle.value;
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`);

        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        return data;
    }

    // Update UI with weather data
    function updateWeatherUI(weatherData) {
        const currentWeather = weatherData.list[0];
        const cityName = weatherData.city.name;
        const icon = currentWeather.weather[0].icon;
        const temperature = Math.round(currentWeather.main.temp);
        const description = currentWeather.weather[0].description;

        const cityNameElem = document.getElementById('city-name');
        const weatherDescElem = document.getElementById('weather-description');

        if (cityNameElem) cityNameElem.textContent = cityName;
        if (weatherDescElem) weatherDescElem.textContent = description;

        if (weatherDataDiv) {
            weatherDataDiv.innerHTML = `
                <div class="flex items-center">
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon" class="w-16 h-16 mr-4">
                    <div>
                        <h2 class="text-2xl font-bold">${temperature}°</h2>
                        <p class="text-lg capitalize">${description}</p>
                    </div>
                </div>
            `;
        }

        updateBackground(description);
    }

    // Update background based on weather condition
    function updateBackground(weatherCondition) {
        const widget = document.getElementById('weather-widget');
        if (!widget) return;

        widget.className = 'p-6 shadow-lg rounded-lg mb-6 card'; // Reset classes

        if (weatherCondition.includes('clear')) {
            widget.classList.add('bg-blue-300');
        } else if (weatherCondition.includes('cloud')) {
            widget.classList.add('bg-gray-300');
        } else if (weatherCondition.includes('rain')) {
            widget.classList.add('bg-blue-600');
        } else if (weatherCondition.includes('thunderstorm')) {
            widget.classList.add('bg-gray-800');
        } else if (weatherCondition.includes('snow')) {
            widget.classList.add('bg-white');
        } else {
            widget.classList.add('bg-gray-400');
        }
    }

    // Initialize charts
    function initializeCharts(weatherData) {
        const next5Days = weatherData.list.slice(0, 5);

        // Prepare data for charts
        const labels = next5Days.map(data => new Date(data.dt * 1000).toLocaleDateString());
        const temperatures = next5Days.map(data => data.main.temp);
        const weatherConditions = next5Days.map(data => data.weather[0].main);

        // Bar Chart
        const ctxBar = document.getElementById('bar-chart');
        if (ctxBar) {
            if (barChart) barChart.destroy();
            barChart = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Temperature',
                        data: temperatures,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: `Temperature (${unitToggle.value === 'metric' ? '°C' : '°F'})`
                            }
                        }
                    },
                    animation: {
                        delay: (context) => context.dataIndex * 300
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Temperature for the Next 5 Days'
                        }
                    }
                }
            });
        }

        // Doughnut Chart
        const weatherCounts = {};
        weatherConditions.forEach(condition => {
            weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
        });

        const ctxDoughnut = document.getElementById('doughnut-chart');
        if (ctxDoughnut) {
            if (doughnutChart) doughnutChart.destroy();
            doughnutChart = new Chart(ctxDoughnut, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(weatherCounts),
                    datasets: [{
                        data: Object.values(weatherCounts),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)'
                        ]
                    }]
                },
                options: {
                    animation: {
                        delay: (context) => context.dataIndex * 300
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Weather Conditions Distribution'
                        }
                    }
                }
            });
        }

        // Line Chart
        const ctxLine = document.getElementById('line-chart');
        if (ctxLine) {
            if (lineChart) lineChart.destroy();
            lineChart = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Temperature',
                        data: temperatures,
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: `Temperature (${unitToggle.value === 'metric' ? '°C' : '°F'})`
                            }
                        }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutBounce'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Temperature Changes for the Next 5 Days'
                        }
                    }
                }
            });
        }
    }

    // Render weather table
    function renderTableWithPagination(weatherData) {
        if (!weatherTable) return;

        const rowsPerPage = 10;
        const totalPages = Math.ceil(weatherData.list.length / rowsPerPage);
        let currentPage = 1;

        function renderPage(page) {
            const start = (page - 1) * rowsPerPage;
            const end = start + rowsPerPage;
            const pageData = weatherData.list.slice(start, end);

            weatherTable.innerHTML = '';
            pageData.forEach(data => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-2 px-4">${new Date(data.dt * 1000).toLocaleString()}</td>
                    <td class="py-2 px-4">${Math.round(data.main.temp)}°</td>
                    <td class="py-2 px-4">${data.main.humidity}%</td>
                    <td class="py-2 px-4">${data.wind.speed} m/s</td>
                    <td class="py-2 px-4">
                        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="Weather Icon" />
                    </td>
                `;
                weatherTable.appendChild(row);
            });

            updatePaginationButtons(currentPage, totalPages);
        }

        function updatePaginationButtons(currentPage, totalPages) {
            const paginationDiv = document.getElementById('pagination');
            if (!paginationDiv) return;

            paginationDiv.innerHTML = '';

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.classList.add('mx-1', 'px-3', 'py-1', 'bg-blue-500', 'text-white', 'rounded');
                if (i === currentPage) {
                    btn.classList.add('bg-blue-700');
                }
                btn.addEventListener('click', () => {
                    currentPage = i;
                    renderPage(currentPage);
                });
                paginationDiv.appendChild(btn);
            }
        }

        renderPage(currentPage);
    }

    // Event Listeners
    if (searchButton) {
        searchButton.addEventListener('click', async () => {
            const city = searchBar.value;
            if (city) {
                try {
                    const weatherData = await fetchWeather(city);
                    updateWeatherUI(weatherData);
                    initializeCharts(weatherData);
                    renderTableWithPagination(weatherData);
                    if (dashboardSection) dashboardSection.classList.remove('hidden');
                    if (tablesSection) tablesSection.classList.add('hidden');
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    if (unitToggle) {
        unitToggle.addEventListener('change', async () => {
            const city = searchBar.value;
            if (city) {
                try {
                    const weatherData = await fetchWeather(city);
                    updateWeatherUI(weatherData);
                    initializeCharts(weatherData);
                    renderTableWithPagination(weatherData);
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            if (tablesSection) tablesSection.classList.add('hidden');
        });
    }

    if (tablesBtn) {
        tablesBtn.addEventListener('click', () => {
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (tablesSection) tablesSection.classList.remove('hidden');
        });
    }

    // Initialize the page
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    
});