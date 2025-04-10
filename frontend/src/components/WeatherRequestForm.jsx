/**
 * Weather Request Form Component
 * ==============================
 * 
 * This component provides a form for users to request weather data
 * by entering a zipcode. It handles form submission and displays
 * loading state while the request is being processed.
 */

import React, { useState } from 'react';
import '../styles/weather-form.css';

function WeatherRequestForm({ onSubmit, isRequesting }) {
    const [zipcode, setZipcode] = useState('');
    const [error, setError] = useState('');

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate zipcode
        if (!zipcode.trim()) {
            setError('Please enter a zipcode');
            return;
        }

        // Clear error
        setError('');

        // Submit request
        try {
            await onSubmit(zipcode.trim());
            // Clear form after successful submission
            setZipcode('');
        } catch (error) {
            console.error('Error submitting request:', error);
            setError('Failed to submit request. Please try again.');
        }
    };

    return (
        <div className="weather-form-container">
            <h3>Request Weather Data</h3>
            <form className="weather-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="zipcode">Enter Zipcode:</label>
                    <input
                        type="text"
                        id="zipcode"
                        value={zipcode}
                        onChange={(e) => setZipcode(e.target.value)}
                        placeholder="e.g., 90210"
                        disabled={isRequesting}
                    />
                    {error && <div className="error-message">{error}</div>}
                </div>
                <button
                    type="submit"
                    className="request-button"
                    disabled={isRequesting || !zipcode.trim()}
                >
                    {isRequesting ? 'Requesting...' : 'Get Weather'}
                </button>
            </form>
            <div className="form-info">
                <p>
                    <strong>How it works:</strong> When you submit a zipcode, the request is sent to the
                    WeatherOracle smart contract. An off-chain oracle node will fetch the weather data
                    and send it back to the contract, where it will be permanently stored on the blockchain.
                </p>
            </div>
        </div>
    );
}

export default WeatherRequestForm;
