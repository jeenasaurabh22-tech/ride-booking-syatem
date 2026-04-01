import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import socket from "../lib/socket";
import { clearAuth, getUser } from "../lib/storage";

// Dummy nearby drivers for demo
const DUMMY_DRIVERS = [
  { id: 1, name: "Rajesh Kumar", vehicle: "Maruti Swift • DL 01 AB 1234", rating: 4.9, trips: 456, lat: 12.971, lng: 77.594, distance: 0.8 },
  { id: 2, name: "Priya Singh", vehicle: "Hyundai Xcent • DL 02 CD 5678", rating: 4.7, trips: 312, lat: 12.973, lng: 77.595, distance: 1.2 },
  { id: 3, name: "Akshay Patel", vehicle: "Toyota Etios • DL 03 EF 9012", rating: 4.8, trips: 678, lat: 12.970, lng: 77.593, distance: 0.5 },
];

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(getUser());
  const [isOnline, setIsOnline] = useState(false);
  const [lat, setLat] = useState("12.9716");
  const [lng, setLng] = useState("77.5946");
  const [city, setCity] = useState(user?.city || "Bengaluru");
  const [status, setStatus] = useState("idle"); // idle, en-route, arrived, ongoing, completed
  const [assignedRide, setAssignedRide] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState(DUMMY_DRIVERS);
  const [locationUpdates, setLocationUpdates] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "driver") {
      navigate("/auth?role=driver");
      return;
    }

    socket.emit("register:driver", { driverId: user.id });

    const onRideAssigned = (payload) => {
      setAssignedRide(payload);
      setStatus("en-route");
    };

    socket.on("ride:assigned", onRideAssigned);
    return () => socket.off("ride:assigned", onRideAssigned);
  }, [navigate, user]);

  // Simulate location updates for nearby drivers
  useEffect(() => {
    const interval = setInterval(() => {
      setNearbyDrivers((prev) =>
        prev.map((driver) => ({
          ...driver,
          lat: driver.lat + (Math.random() - 0.5) * 0.001,
          lng: driver.lng + (Math.random() - 0.5) * 0.001,
          distance: Math.max(0.1, driver.distance + (Math.random() - 0.5) * 0.1),
        }))
      );
      setLocationUpdates((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const updateOnline = async (value) => {
    try {
      setError("");
      setLoading(true);
      await api.patch("/drivers/online", { isOnline: value });
      setIsOnline(value);
      if (!value) setStatus("idle");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update online status");
    } finally {
      setLoading(false);
    }
  };

  const pushLocation = async () => {
    try {
      setError("");
      setLoading(true);
      await api.patch("/drivers/location", {
        lat: Number(lat),
        lng: Number(lng),
        city,
      });

      socket.emit("driver:location:update", {
        driverId: user.id,
        city,
        lat: Number(lat),
        lng: Number(lng),
      });

      // Simulate location update for nearby drivers
      setNearbyDrivers((prev) =>
        prev.map((driver) => ({
          ...driver,
          distance: Math.max(
            0.1,
            driver.distance + (Math.random() - 0.5) * 0.2
          ),
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update location");
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (newStatus) => {
    if (!assignedRide?.rideId) return;

    try {
      setError("");
      setLoading(true);
      await api.patch(`/rides/${assignedRide.rideId}/status`, {
        status: newStatus,
      });

      setStatus(newStatus);

      if (newStatus === "completed") {
        setAssignedRide(null);
        setStatus("idle");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update ride status");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    navigate("/auth?role=driver");
  };

  const getStatusColor = (s) => {
    switch (s) {
      case "idle":
        return "#666";
      case "en-route":
        return "#ff6b35";
      case "arrived":
        return "#ffc107";
      case "ongoing":
        return "#2196f3";
      case "completed":
        return "#4caf50";
      default:
        return "#666";
    }
  };

  const getStatusLabel = (s) => {
    switch (s) {
      case "idle":
        return "📍 Idle";
      case "en-route":
        return "🚗 En Route";
      case "arrived":
        return "🎯 Arrived";
      case "ongoing":
        return "🚕 Ride Started";
      case "completed":
        return "✓ Completed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div>
          <h2>RideFlow Driver</h2>
          <p>Welcome, {user?.name}!</p>
        </div>
        <button className="ghost" onClick={logout} type="button">
          Logout
        </button>
      </header>

      <div className="content-grid">
        {/* Status Panel */}
        <div className="panel">
          <h3>🟢 Your Status</h3>

          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                background: isOnline
                  ? "linear-gradient(135deg, rgba(6, 214, 160, 0.1), rgba(6, 214, 160, 0.05))"
                  : "linear-gradient(135deg, rgba(200, 0, 0, 0.08), rgba(200, 0, 0, 0.04))",
                border: `2px solid ${isOnline ? "var(--success)" : "#d32f2f"}`,
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "0.85rem",
                  color: "var(--text-soft)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Online Status
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: "1.4rem",
                  fontWeight: "700",
                  color: isOnline ? "var(--success)" : "#d32f2f",
                }}
              >
                {isOnline ? "🟢 ONLINE" : "🔴 OFFLINE"}
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="cta"
              onClick={() => updateOnline(true)}
              disabled={loading || isOnline}
              type="button"
            >
              Go Online
            </button>
            <button
              className="secondary"
              onClick={() => updateOnline(false)}
              disabled={loading || !isOnline}
              type="button"
            >
              Go Offline
            </button>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "var(--bg-light)",
              borderRadius: "8px",
              borderLeft: "3px solid var(--primary)",
            }}
          >
            <p style={{ margin: "0", fontSize: "0.85rem", color: "var(--text-soft)" }}>
              <strong>Current Ride Status:</strong>
            </p>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "0.95rem",
                fontWeight: "700",
                color: getStatusColor(status),
              }}
            >
              {getStatusLabel(status)}
            </p>
          </div>
        </div>

        {/* Location Panel */}
        <div className="panel">
          <h3>📍 Live Location</h3>

          <label>City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={loading}
            placeholder="e.g., Bengaluru"
          />

          <label>Latitude</label>
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            disabled={loading}
            type="number"
            step="0.0001"
          />

          <label>Longitude</label>
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            disabled={loading}
            type="number"
            step="0.0001"
          />

          <button
            className="cta"
            type="button"
            onClick={pushLocation}
            disabled={loading || !isOnline}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ marginRight: "8px" }}></span>
                Updating...
              </>
            ) : (
              "Update Location"
            )}
          </button>

          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              background: "rgba(0,0,0,0.04)",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "var(--text-soft)",
            }}
          >
            Updates: {locationUpdates} • Drivers synced: {nearbyDrivers.length}
          </div>
        </div>

        {/* Assigned Ride */}
        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <h3>🚕 Assigned Ride</h3>

          {!assignedRide ? (
            <div className="empty-state">
              <h4>No Ride Assigned</h4>
              <p>Go online to receive ride requests from users.</p>
            </div>
          ) : (
            <>
              <div className="ride-details">
                <h4>Trip Details</h4>
                <div className="metric">
                  <span>Pickup</span>
                  <strong>{assignedRide.pickupCity}</strong>
                </div>
                <div className="metric">
                  <span>Drop-off</span>
                  <strong>{assignedRide.dropCity}</strong>
                </div>
                <div className="metric">
                  <span>Distance</span>
                  <strong>{assignedRide.shortestDistanceKm} km</strong>
                </div>

                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                  <div
                    style={{
                      padding: "12px",
                      background: "var(--bg-light)",
                      borderRadius: "8px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: "0.8rem",
                        color: "var(--text-soft)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Current Status
                    </p>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        color: getStatusColor(status),
                      }}
                    >
                      {getStatusLabel(status)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                {status === "en-route" && (
                  <button
                    className="cta"
                    onClick={() => updateRideStatus("arrived")}
                    disabled={loading}
                    type="button"
                  >
                    Mark Arrived
                  </button>
                )}
                {status === "arrived" && (
                  <button
                    className="cta"
                    onClick={() => updateRideStatus("ongoing")}
                    disabled={loading}
                    type="button"
                  >
                    Start Ride
                  </button>
                )}
                {status === "ongoing" && (
                  <button
                    className="cta"
                    onClick={() => updateRideStatus("completed")}
                    disabled={loading}
                    type="button"
                  >
                    Complete Ride
                  </button>
                )}
              </div>
            </>
          )}

          {error && <p className="error-text">{error}</p>}
        </div>

        {/* Nearby Drivers */}
        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <h3>👥 Nearby Drivers (Demo)</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", marginBottom: "16px" }}>
            Real-time locations of nearby drivers in Bengaluru
          </p>

          {nearbyDrivers.map((driver) => (
            <div key={driver.id} className="driver-card">
              <div className="driver-avatar">{driver.name.charAt(0)}</div>
              <div className="driver-info">
                <h4>{driver.name}</h4>
                <p>{driver.vehicle}</p>
                <p style={{ fontSize: "0.75rem", color: "#888" }}>
                  ⭐ {driver.rating} • {driver.trips} trips
                </p>
              </div>
              <div className="driver-distance">
                <strong>{Math.round(driver.distance * 10) / 10} km</strong>
                <span>away</span>
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(255, 152, 0, 0.08)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 152, 0, 0.2)",
              fontSize: "0.8rem",
              color: "var(--text-soft)",
            }}
          >
            <p style={{ margin: "0" }}>
              <strong>Demo Mode:</strong> Using simulated driver locations for demonstration purposes
            </p>
            <p style={{ margin: "4px 0 0 0" }}>
              Real GPS location tracking and geolocation features will be available in the next update
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
