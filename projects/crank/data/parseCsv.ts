import { parse } from "csv-parse";
import { createReadStream } from "fs";

interface WeatherData {
  Date: string;
  "TAVG (Degrees Fahrenheit)": string | null;
  "TMAX (Degrees Fahrenheit)": string | null;
  "TMIN (Degrees Fahrenheit)": string | null;
  "PRCP (Inches)": string | null;
  "SNOW (Inches)": string | null;
  "SNWD (Inches)": string | null;
}

async function parseCSVFile(filePath: string): Promise<WeatherData[]> {
  return new Promise((resolve, reject) => {
    const csvStream = createReadStream(filePath);
    const parser = parse({
      columns: true, // Use the first line of the file as column names
      skip_empty_lines: true, // Skip empty lines in the CSV file
      trim: true, // Trim spaces around columns
      cast: (value, context) => {
        // Convert empty strings to null for a cleaner data representation
        return value === "" ? null : value;
      },
    });
    const records: WeatherData[] = [];

    csvStream
      .pipe(parser)
      .on("data", (record) => records.push(record))
      .on("end", () => resolve(records))
      .on("error", reject);
  });
}

export default parseCSVFile;
