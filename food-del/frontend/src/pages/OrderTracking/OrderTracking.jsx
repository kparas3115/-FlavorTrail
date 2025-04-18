import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '20px',
  marginTop: '20px'
};

// Dummy coordinates (customize as needed)
const userLocation = { lat: 19.0760, lng: 72.8777 };
const deliveryLocation = { lat: 19.0966, lng: 72.8260 };

const OrderTracking = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Track Your Order</h2>
      <p>Your order is on its way! Estimated delivery: 25 minutes.</p>

      <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLocation}
          zoom={13}
        >
          <Marker position={userLocation} label="You" />
          <Marker position={deliveryLocation} label="Delivery" />
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default OrderTracking;
