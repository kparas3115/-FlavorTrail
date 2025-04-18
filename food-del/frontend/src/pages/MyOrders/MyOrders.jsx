import React, { useContext, useEffect, useRef, useState } from 'react';
import './MyOrders.css';
import axios from 'axios';
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import polyline from '@mapbox/polyline';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Distance formula (Haversine)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MyOrders = () => {
  const [data, setData] = useState([]);
  const { url, token, currency } = useContext(StoreContext);

  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [hotelName, setHotelName] = useState('');
  const [hotelOptions, setHotelOptions] = useState([]);
  const [hotelLocation, setHotelLocation] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [travelInfo, setTravelInfo] = useState(null);

  const searchInputRef = useRef(null); // Ref for focusing input

  const fetchOrders = async () => {
    const response = await axios.post(`${url}/api/order/userorders`, {}, { headers: { token } });
    setData(response.data.data);
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeliveryLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setDeliveryLocation({
            lat: 19.0760,
            lng: 72.8777,
          });
        }
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!hotelName || !deliveryLocation) return;

    const query = encodeURIComponent(hotelName);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const results = await response.json();

    if (results.length === 0) {
      alert("No hotels found.");
      return;
    }

    const filtered = results.filter((place) => {
      const dist = getDistanceFromLatLonInKm(
        deliveryLocation.lat,
        deliveryLocation.lng,
        parseFloat(place.lat),
        parseFloat(place.lon)
      );
      return dist <= 5;
    });

    if (filtered.length === 0) {
      alert("No nearby hotels within 5 km found.");
      setHotelOptions([]);
      return;
    }

    setHotelOptions(filtered);
    setSelectedHotel(null);
    setHotelLocation(null);
  };

  const fetchRoute = async (start, end) => {
    const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline&access_token=pk.eyJ1Ijoia3BzLTMxMTUiLCJhIjoiY205am81djltMGRjZjJrc2s4MWlqMXp5byJ9.yV01ihLMT-dDVpVQcm6FOQ`);
    const data = await res.json();

    if (data.code === 'Ok') {
      const coords = polyline.decode(data.routes[0].geometry).map(([lat, lng]) => [lat, lng]);
      setRouteCoords(coords);
      setTravelInfo({
        duration: (data.routes[0].duration / 60).toFixed(1),
        distance: (data.routes[0].distance / 1000).toFixed(2),
      });
    }
  };

  useEffect(() => {
    if (deliveryLocation && hotelLocation) {
      fetchRoute(deliveryLocation, hotelLocation);
    }
  }, [hotelLocation]);

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => (
          <div key={index} className='my-orders-order'>
            <img src={assets.parcel_icon} alt="" />
            <p>{order.items.map((item, idx) =>
              item.name + " x " + item.quantity + (idx === order.items.length - 1 ? "" : ", ")
            )}</p>
            <p>{currency}{order.amount}.00</p>
            <p>Items: {order.items.length}</p>
            <p><span>&#x25cf;</span> <b>{order.status}</b></p>
            <button onClick={() => {
              fetchOrders();
              searchInputRef.current?.focus();
              searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}>
              Track Order
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: "40px" }}>📍 Real-time Order Tracking</h3>

      <div className='map-tools' style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          ref={searchInputRef}
          type="text"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          placeholder='Enter hotel name...'
          style={{ padding: "10px", flex: "1", minWidth: "200px" }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: "10px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "5px" }}
        >
          Search Hotel
        </button>
        {hotelOptions.length > 0 && (
          <select
            style={{ padding: "10px", minWidth: "250px" }}
            onChange={(e) => {
              const selected = hotelOptions[e.target.value];
              setSelectedHotel(selected.display_name);
              setHotelLocation({ lat: parseFloat(selected.lat), lng: parseFloat(selected.lon) });
            }}
          >
            <option value="">Select correct hotel...</option>
            {hotelOptions.map((option, idx) => (
              <option key={idx} value={idx}>{option.display_name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="map-container">
        {deliveryLocation && hotelLocation && (
          <MapContainer
            center={deliveryLocation}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '400px', width: '100%', marginTop: '20px', borderRadius: '10px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={deliveryLocation}>
              <Popup>You (Delivery Location)</Popup>
            </Marker>
            <Marker position={hotelLocation}>
              <Popup>
                Hotel: {selectedHotel || hotelName}<br />
                {travelInfo && travelInfo.duration > 15 ? "Driver: There's traffic, please wait!" : "Driver is en route."}
              </Popup>
            </Marker>
            {routeCoords.length > 0 && (
              <Polyline positions={routeCoords} color={travelInfo?.duration > 15 ? "red" : "green"} />
            )}
          </MapContainer>
        )}
      </div>

      {travelInfo && (
        <div className='travel-info'>
          <p>🚗 Estimated Time: <b>{travelInfo.duration} mins</b></p>
          <p>📏 Distance: <b>{travelInfo.distance} km</b></p>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
