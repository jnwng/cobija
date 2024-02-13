import parseCSVFile from "./parseCsv";

export enum Temperature {
  Cool = "cool",
  Medium = "medium",
  Hot = "hot",
}

export async function analyzeWeatherData() {
  try {
    const weatherData = await parseCSVFile("./Cobija Temp Data.csv"); // Adjust the path to your CSV file
    const temperatureResults: {
      date: string;
      tavg: number;
      temp: Temperature;
    }[] = [];
    weatherData.forEach((data) => {
      if (data["TAVG (Degrees Fahrenheit)"] !== null) {
        const tavg = parseInt(data["TAVG (Degrees Fahrenheit)"], 10);
        if (!isNaN(tavg)) {
          if (tavg < 72.5) {
            temperatureResults.push({
              date: data["Date"],
              tavg,
              temp: Temperature.Cool,
            });
          } else if (tavg >= 72.5 && tavg <= 78.4) {
            temperatureResults.push({
              date: data["Date"],
              tavg,
              temp: Temperature.Medium,
            });
          } else {
            temperatureResults.push({
              date: data["Date"],
              tavg,
              temp: Temperature.Hot,
            });
          }
        }
      }
    });
    return temperatureResults;
  } catch (error) {
    console.error("Error analyzing weather data:", error);
    return [];
  }
}
