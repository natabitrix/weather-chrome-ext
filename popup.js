document.addEventListener('DOMContentLoaded', function() {
    // Обновляем иконку при открытии popup
    chrome.runtime.sendMessage({ action: 'updateIcon' });

    const apiKey = '24c68cc727a2ce21553a3dad24009049'; // Ваш API ключ
    const city = 'Бабяково'; // Ваш город
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=ru`;

    const windIcon = '<svg data-v-47880d39="" width="10" height="10" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve" class="icon-wind-direction" style="transform: rotate(413deg);"><g data-v-47880d39="" fill="#48484a"><path data-v-47880d39="" d="M510.5,749.6c-14.9-9.9-38.1-9.9-53.1,1.7l-262,207.3c-14.9,11.6-21.6,6.6-14.9-11.6L474,48.1c5-16.6,14.9-18.2,21.6,0l325,898.7c6.6,16.6-1.7,23.2-14.9,11.6L510.5,749.6z"></path><path data-v-47880d39="" d="M817.2,990c-8.3,0-16.6-3.3-26.5-9.9L497.2,769.5c-5-3.3-18.2-3.3-23.2,0L210.3,976.7c-19.9,16.6-41.5,14.9-51.4,0c-6.6-9.9-8.3-21.6-3.3-38.1L449.1,39.8C459,13.3,477.3,10,483.9,10c6.6,0,24.9,3.3,34.8,29.8l325,898.7c5,14.9,5,28.2-1.7,38.1C837.1,985,827.2,990,817.2,990z M485.6,716.4c14.9,0,28.2,5,39.8,11.6l255.4,182.4L485.6,92.9l-267,814.2l223.9-177.4C454.1,721.4,469,716.4,485.6,716.4z"></path></g></svg>';
    
    // Функция для отображения ошибки
    function showError(message) {
        const weatherDiv = document.getElementById('weather');
        if (weatherDiv) {
            weatherDiv.innerHTML = `<p style="color: red;">Ошибка: ${message}</p>`;
        } else {
            console.error('Элемент #weather не найден');
        }
    }

    // Получение текущей погоды
    fetch(weatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке данных');
            }
            return response.json();
        })
        .then(data => {
            if (data.main && data.weather && data.wind) {
                const tempElement = document.getElementById('temp');
                const precipitationElement = document.getElementById('precipitation');
                const precipitationIconElement = document.getElementById('precipitation-icon');
                const windElement = document.getElementById('wind');
                const cityElement = document.getElementById('city');
                const dateElement = document.getElementById('current-date');

                const curDate = Date();
                const formattedCurDate = new Date(curDate).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    weekday: 'short',
                }).replace(/\./g, '');
                dateElement.textContent = formattedCurDate;

                cityElement.textContent = `${city}`;

                if (tempElement && precipitationElement && windElement) {


                    let temperature = Math.round(data.main.temp); // Округление температуры
                    if (temperature > 0) {
                        temperature = "+" + temperature;
                    }
                    tempElement.textContent = `${temperature}°C`;
                    precipitationElement.textContent = data.weather[0].description;
                    windElement.textContent = `${data.wind.speed} м/с`;

                    const iconCode = data.weather[0].icon;
                    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
                    precipitationIconElement.innerHTML = '<img src="'+iconUrl+'">';

                } else {
                    showError('Элементы для отображения погоды не найдены');
                }
            } else {
                showError('Данные о погоде недоступны');
            }
        })
        .catch(error => {
            showError(error.message);
        });

    // Получение прогноза на неделю
    fetch(forecastUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при загрузке данных');
        }
        return response.json();
    })
    .then(data => {
        if (data.list) {
            const forecastList = document.getElementById('forecast-list');
            if (forecastList) {
                forecastList.innerHTML = ''; // Очистка списка

                // Группируем данные по дням
                const groupedByDay = groupForecastByDay(data.list);

                const curDate = new Date().toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                });

                const curDayData = groupedByDay[curDate];
                const nextDayData = groupedByDay[getNextDay(curDate)];

                // Определяем текущее время суток
                const currentTimeOfDay = getCurrentTimeOfDay();

                // Заполняем блоки данными
                fillForecastBlocks(curDayData, nextDayData, currentTimeOfDay);

                // Переставляем блоки в нужном порядке
                rearrangeTodayForecast(currentTimeOfDay, curDayData, nextDayData);

                // Отображаем прогноз по дням
                Object.keys(groupedByDay).forEach(date => {
                    const dayData = groupedByDay[date];

                    // Создаем элемент для дня
                    const li = document.createElement('li');
                    li.className = 'day-forecast';

                    // Форматируем дату
                    const formattedDate = new Date(dayData.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        weekday: 'short',
                    }).replace(/\./g, '');

                    // Находим минимальную и максимальную температуру
                    let minTemp = Math.round(Math.min(...dayData.temps));
                    let maxTemp = Math.round(Math.max(...dayData.temps));

                    if (minTemp > 0) {
                        minTemp = "+" + minTemp;
                    }
                    if (maxTemp > 0) {
                        maxTemp = "+" + maxTemp;
                    }
                    const icon1 = `https://openweathermap.org/img/wn/${dayData.icons[0]}.png`;
                    const icon2 = `https://openweathermap.org/img/wn/${dayData.icons[1]}.png`;

                    // Находим минимальную и максимальную скорость ветра
                    const minWind = Math.round(Math.min(...dayData.winds));
                    const maxWind = Math.round(Math.max(...dayData.winds));

                    // Отображаем данные
                    li.innerHTML = `
                        <div class="day-summary">
                            <span class="date">${formattedDate}</span>
                            <span class="icons"><img src="${icon1}"><img src="${icon2}"></span>
                            <span class="temp">${minTemp} / ${maxTemp}°C</span>
                            <span class="wind">${windIcon} ${minWind} - ${maxWind} м/с</span>
                            <button class="toggle-hourly">▼</button>
                        </div>
                        <ul class="hourly-forecast" style="display: none;"></ul>
                    `;

                    // Добавляем обработчик для кнопки
                    const toggleButton = li.querySelector('.toggle-hourly');
                    const hourlyForecast = li.querySelector('.hourly-forecast');

                    toggleButton.addEventListener('click', () => {
                        if (hourlyForecast.style.display === 'none') {
                            // Загружаем почасовой прогноз
                            let hourlyForecastHtml = '';
                            dayData.hourly.forEach(hour => {
                                let temp = Math.round(hour.main.temp);
                                if (temp > 0) {
                                    temp = "+" + temp;
                                }
                                
                                const iconCode = hour.weather[0].icon;
                                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

                                const description = hour.weather[0].description;

                                hourlyForecastHtml += `
                                    <li>
                                        <div class="time" style="width: 40px;">${new Date(hour.dt * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>

                                        <div class="temp" style="width: 40px;">${temp}°C</div>

                                        <div class="d-flex align-items-center" style="width: 130px;">
                                            <img src="${iconUrl}">

                                            <div class="description font10">${description}</div>
                                        </div>

                                        <div class="wind" style="width: 50px;">${windIcon} ${Math.round(hour.wind.speed)} м/с</div>
                                    </li>
                                `;
                            });
                            hourlyForecast.innerHTML = hourlyForecastHtml;

                            hourlyForecast.style.display = 'block';
                            toggleButton.textContent = '▲';
                            li.querySelector('.day-summary').style = 'background-color:#48484a';
                        } else {
                            hourlyForecast.style.display = 'none';
                            toggleButton.textContent = '▼';
                            li.querySelector('.day-summary').style = 'background-color:none';
                        }
                    });

                    forecastList.appendChild(li);
                });
            } else {
                showError('Элемент #forecast-list не найден');
            }
        } else {
            showError('Данные о прогнозе недоступны');
        }
    })
    .catch(error => {
        showError(error.message);
    });








    // Группировка прогноза по дням
    function groupForecastByDay(forecastList) {
        const grouped = {};

        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });

            if (!grouped[date]) {
                grouped[date] = {
                    date: item.dt * 1000,
                    temps: [],
                    icons: [],
                    winds: [],
                    hourly: [],
                };
            }

            grouped[date].temps.push(item.main.temp);
            grouped[date].icons.push(item.weather[0].icon);
            grouped[date].winds.push(item.wind.speed);
            grouped[date].hourly.push(item);
            
        });

        return grouped;
    }

    function fillForecastBlocks(curDayData, nextDayData) {
        const nightForecast = document.getElementById('night-forecast');
        const morningForecast = document.getElementById('morning-forecast');
        const middayForecast = document.getElementById('midday-forecast');
        const eveningForecast = document.getElementById('evening-forecast');
    
        const blocks = {
            night: nightForecast,
            morning: morningForecast,
            midday: middayForecast,
            evening: eveningForecast,
        };
    
        // Заполняем блоки данными
        Object.keys(blocks).forEach(timeOfDay => {
            const block = blocks[timeOfDay];
            block.innerHTML = '';
    
            // Определяем, откуда брать данные (текущий день или следующий)
            const data = curDayData.hourly.filter(item => {
                const hour = new Date(item.dt * 1000).getHours();
                if (timeOfDay === 'night') return hour >= 0 && hour < 6;
                if (timeOfDay === 'morning') return hour >= 6 && hour < 12;
                if (timeOfDay === 'midday') return hour >= 12 && hour < 18;
                if (timeOfDay === 'evening') return hour >= 18 && hour < 24;
            });
    
            // Если данных нет, берем из следующего дня
            if (data.length === 0 && nextDayData) {
                const nextDayHourly = nextDayData.hourly.filter(item => {
                    const hour = new Date(item.dt * 1000).getHours();
                    if (timeOfDay === 'night') return hour >= 0 && hour < 6;
                    if (timeOfDay === 'morning') return hour >= 6 && hour < 12;
                    if (timeOfDay === 'midday') return hour >= 12 && hour < 18;
                    if (timeOfDay === 'evening') return hour >= 18 && hour < 24;
                });
                data.push(...nextDayHourly);
            }
    
            // Заполняем блок данными
            data.forEach(item => {

                const date = new Date(item.dt * 1000).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    weekday: 'short',
                }).replace(/\./g, '');


                let hour = new Date(item.dt * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                let temp = Math.round(item.main.temp);
                if (temp > 0) {
                    temp = "+" + temp;
                }
                const iconCode = item.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
    
                const colors = {
                    "#8800ff": [-100, -30],
                    "#6200ff": [-30, -15],
                    "#1900ff": [-15, -5],
                    "#0051ff": [-5, 0],
                    "#00a8d6": [0, 5],
                    "#00de81": [5, 10],
                    "#34df00": [10, 15],
                    "#ffd500": [15, 20],
                    "#ff9d00": [20, 25],
                    "#ff5e00": [25, 30],
                    "#ff0000": [30, 100],
                };
    
                let bg = 'green';
    
                for (const [color, range] of Object.entries(colors)) {
                    if (temp >= range[0] && temp <= range[1]) {
                        bg = color;
                        break;
                    }
                }
    
                let itemHtml = `
                    <div title="${date} ${hour}" style="">        
                        <div style="background:${bg}80" class="p-1">        
                            <div class="precipitation text-center">
                                <div class="d-flex align-items-center text-center">
                                    <span class="temp">${temp}°C</span>
                                    <img src="${iconUrl}">
                                </div>
                                <div class="description font10 d-flex align-items-center justify-content-center" style="height:30px;margin-top:-5px;">${item.weather[0].description}</div>
                            </div>
                            <span class="wind font10">${windIcon} ${Math.round(item.wind.speed)} м/с</span>
                        </div>
                    </div>
                `;
                let li = document.createElement('li');
                li.innerHTML = itemHtml;
                block.appendChild(li);
            });
        });
    
        // Удаляем пустые блоки
        removeEmptyBlocks();
    }

    function removeEmptyBlocks() {
        const todayForecast = document.getElementById('today-forecast');
        const forecastItems = Array.from(todayForecast.children);
    
        forecastItems.forEach(item => {
            const list = item.querySelector('ul');
            if (list.children.length === 0) {
                item.remove(); // Удаляем блок, если он пустой
            }
        });
    }

    function getNextDay(dateString) {
        const date = new Date(dateString.split('.').reverse().join('-')); // Преобразуем строку в Date
        date.setDate(date.getDate() + 1); // Добавляем 1 день
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }

    function getCurrentTimeOfDay() {
        const hour = new Date().getHours();
    
        if (hour >= 0 && hour < 6) {
            return 'night'; // Ночь
        } else if (hour >= 6 && hour < 12) {
            return 'morning'; // Утро
        } else if (hour >= 12 && hour < 18) {
            return 'midday'; // День
        } else {
            return 'evening'; // Вечер
        }
    }

    function rearrangeTodayForecast(currentTimeOfDay, curDayData, nextDayData) {
        const todayForecast = document.getElementById('today-forecast');
        const forecastItems = Array.from(todayForecast.children);
    
        // Получаем правильный порядок блоков
        const newOrder = getBlockOrder(currentTimeOfDay);
    
        // Удаляем все блоки
        todayForecast.innerHTML = '';
    
        // Добавляем блоки в нужном порядке
        newOrder.forEach(timeOfDay => {
            const item = forecastItems.find(el => el.classList.contains(`${timeOfDay}-forecast`));
            if (item) {
                todayForecast.appendChild(item);
            }
        });
    
        // Если данных для текущего времени суток нет, добавляем блоки из следующего дня
        if (!curDayData.hourly.some(item => {
            const hour = new Date(item.dt * 1000).getHours();
            if (currentTimeOfDay === 'night') return hour >= 0 && hour < 6;
            if (currentTimeOfDay === 'morning') return hour >= 6 && hour < 12;
            if (currentTimeOfDay === 'midday') return hour >= 12 && hour < 18;
            if (currentTimeOfDay === 'evening') return hour >= 18 && hour < 24;
        })) {
            // Добавляем блоки из следующего дня
            const nextDayOrder = getBlockOrder(newOrder[newOrder.length - 1]);
            nextDayOrder.forEach(timeOfDay => {
                const item = forecastItems.find(el => el.classList.contains(`${timeOfDay}-forecast`));
                if (item) {
                    todayForecast.appendChild(item);
                }
            });
        }
    }
    
    function getBlockOrder(currentTimeOfDay) {
        // Порядок блоков в зависимости от времени суток
        const order = {
            night: ['night', 'morning', 'midday', 'evening'], // Ночь → Утро → День → Вечер
            morning: ['midday', 'evening', 'night', 'morning'], // Утро → День → Вечер → Следующая ночь
            midday: ['midday', 'evening', 'night', 'morning'], // День → Вечер → Следующая ночь → Следующее утро
            evening: ['evening', 'night', 'morning', 'midday'], // Вечер → Следующая ночь → Следующее утро → Следующий день
        };
    
        return order[currentTimeOfDay];
    }

});