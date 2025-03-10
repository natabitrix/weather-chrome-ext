// Функция для обновления температуры на иконке
async function updateWeatherIcon() {
    // console.log('Запуск обновления иконки'); // Логирование
    const apiKey = '24c68cc727a2ce21553a3dad24009049'; // Ваш API ключ
    const city = 'Бабяково'; // Ваш город
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;

    try {
        // console.log('Запрос данных о погоде...'); // Логирование
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке данных');
        }
        const data = await response.json();
        // console.log('Данные о погоде получены:', data); // Логирование

        if (data.main && data.weather && data.wind) {
            let temperature = Math.round(data.main.temp); // Округление температуры
            if (temperature > 0) {
                temperature = "+" + temperature;
            }

            // Получаем код иконки из API
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            
            updateIcon(iconUrl, temperature, data.wind.speed);
        } else {
            console.error('Данные о погоде недоступны');
        }
    } catch (error) {
        console.error('Ошибка при обновлении погоды:', error);
    }
}

// Функция для обновления иконки
function updateIcon(iconUrl, temperature, wind) {
    // console.log('Обновление иконки с температурой:', temperature); // Логирование

    // Загружаем иконку
    fetch(iconUrl)
        .then(response => response.blob())
        .then(blob => createImageBitmap(blob))
        .then(imageBitmap => {
            const canvas = new OffscreenCanvas(32, 32);
            const context = canvas.getContext('2d');

            context.fillStyle = "rgb(28, 28, 28)";
            context.fillRect(0, 0, 32, 32);

            // Рисуем иконку
            context.drawImage(imageBitmap, 0, 0, 32, 32);

            // Рисуем текст с температурой
            context.fillStyle = '#FFFFFF'; // Цвет текста
            context.font = '18px Arial'; // Размер и шрифт
            context.textAlign = 'left';
            context.textBaseline = 'top';

            // Настройки тени
            context.shadowColor = 'rgba(0, 0, 0, 0.9)'; // Цвет тени (черный с прозрачностью 50%)
            context.shadowBlur = 1; // Размытие тени
            context.shadowOffsetX = 1; // Смещение тени по горизонтали
            context.shadowOffsetY = -1; // Смещение тени по вертикали

            context.fillText(`${temperature}°`, 0, 16);
            // context.fillText(`${wind} м/c`, 0,  16);

            // Получение ImageData из canvas
            const imageData = context.getImageData(0, 0, 32, 32);

            // Установка иконки
            chrome.action.setIcon({ imageData: imageData })
                .then(() => {
                    // console.log('Иконка успешно обновлена'); // Логирование
                })
                .catch((error) => {
                    console.error('Ошибка при обновлении иконки:', error); // Логирование
                });
        })
        .catch(error => {
            console.error('Ошибка при загрузке иконки:', error);
        });
}

// Обновление температуры при запуске расширения
updateWeatherIcon();

// Планирование обновления каждые 60 минут
chrome.alarms.create('updateWeather', { periodInMinutes: 60 });

// Обработка срабатывания будильника
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateWeather') {
        updateWeatherIcon();
    }
});

// Обновление по клику на иконку
chrome.action.onClicked.addListener(() => {
    updateWeatherIcon();
});

// Обработка сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateIcon') {
        // console.log('Получен запрос на обновление иконки');
        updateWeatherIcon();
    }
});