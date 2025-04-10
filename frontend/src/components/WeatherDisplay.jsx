/**
 * Weather Display Component
 * ========================
 * 
 * This component displays weather data received from the oracle.
 * It shows temperature, conditions, location, and the timestamp
 * when the data was received.
 */

import React from 'react';
import '../styles/weather-display.css';

function WeatherDisplay({ data }) {
    // Format timestamp to readable date/time
    const formatTimestamp = (timestamp) => {
        if (!timestamp || timestamp === '0') return 'N/A';

        try {
            const date = new Date(Number(timestamp) * 1000);
            return date.toLocaleString();
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Invalid timestamp';
        }
    };

    // If no data, show nothing
    if (!data) return null;

    return (
        <div className="weather-display">
            <h3>Weather Results</h3>
            <div className="weather-card">
                <div className="weather-header">
                    <div className="location">{data.location || 'Unknown Location'}</div>
                    <div className="zipcode">Zipcode: {data.zipcode}</div>
                </div>

                <div className="weather-body">
                    <div className="temperature">
                        <span className="temp-value">{data.temperature || 'N/A'}</span>
                    </div>
                    <div className="conditions">
                        {data.conditions || 'No conditions data'}
                    </div>
                </div>

                <div className="weather-footer">
                    <div className="timestamp">
                        Data received: {formatTimestamp(data.timestamp)}
                    </div>
                    <div className="request-id">
                        Request ID: {data.id}
                    </div>
                </div>
            </div>

            <div className="oracle-info">
                <p>
                    This weather data was fetched by an off-chain oracle node and stored on the blockchain.
                    It will remain permanently accessible through the WeatherOracle contract.
                </p>
            </div>
        </div>
    );
}

export default WeatherDisplay;
