function getWeatherData() {
    fetch('/weather')
        .then(response => response.json())
        .then(data => {
            document.getElementById('weather').innerText = `${data.temp}°F`;
        })
        .catch(error => console.error('Error:', error));
}

getWeatherData();
setInterval(getWeatherData, 20 * 60 * 1000);