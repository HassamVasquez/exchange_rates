import axios from 'axios';
import { Client } from 'pg';

// Configuración de la base de datos
const client = new Client({
  user: 'myuser',
  host: 'localhost',
  database: 'exchange_rates',
  password: 'mypassword',
  port: 5432,
});

// Conectar a la base de datos
client.connect();

// Obtener las tasas de cambio del Banco de México
const fetchExchangeRates = async () => {
  const token = '168d369e38e438b6ff633bcf74b04134edb214d8a770fe03d2563ed240c70cec'; 

  try {
    const response = await axios.get('https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718,SF46410/datos/oportuno', { // 
      headers: {
        'Bmx-Token': token
      }
    });

    const data = response.data.bmx.series;
    const usdRate = parseFloat(data[0].datos[0].dato);
    const eurRate = parseFloat(data[1].datos[0].dato);
    const date = data[0].datos[0].fecha;

    return { usdRate, eurRate, date };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

// Insertar tasas de cambio en la base de datos
const insertExchangeRate = async (date: string, usdRate: number, eurRate: number) => {
  await client.query('INSERT INTO exchange_rates (fecha, tipodecambio_usd, tipodecambio_eur) VALUES ($1, $2, $3) ON CONFLICT (fecha) DO NOTHING', [date, usdRate, eurRate]);
};

// Mostrar tasas de cambio en consola
const showExchangeRates = async () => {
  const res = await client.query('SELECT * FROM exchange_rates');
  console.log('Exchange Rates:', res.rows);
};

// Función principal
const main = async () => {

  const rates = await fetchExchangeRates();

  await insertExchangeRate(rates.date, rates.usdRate, rates.eurRate);

  await showExchangeRates();

  await client.end();
};

main().catch(console.error);
