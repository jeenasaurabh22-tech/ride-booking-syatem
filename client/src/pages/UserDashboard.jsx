import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CityAutocomplete from "../components/CityAutocomplete";
import api from "../lib/api";
import socket from "../lib/socket";
import { clearAuth, getUser } from "../lib/storage";
import "./UserDashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(getUser());
  const [pickupCity, setPickupCity] = useState("");
  const [dropCity, setDropCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("booking"); // booking, estimate, confirmed
  const [rideData, setRideData] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [driver, setDriver] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "user") {
      navigate("/auth?role=user");
      return;
    }

    socket.emit("register:user", { userId: user.id });

    const onDriverDistance = (payload) => {
      setLiveDistance(payload.distanceFromDriverToPickupKm);
    };

    const onStatus = (payload) => {
      setRideData((prev) =>
        prev ? { ...prev, status: payload.status } : prev
      );
    };

    socket.on("ride:driver-distance", onDriverDistance);
    socket.on("ride:status", onStatus);

    return () => {
      socket.off("ride:driver-distance", onDriverDistance);
      socket.off("ride:status", onStatus);
    };
  }, [navigate, user]);

  const fetchEstimate = async (e) => {
    e.preventDefault();
    setError("");
    setEstimating(true);

    if (!pickupCity.trim() || !dropCity.trim()) {
      setError("Please select both pickup and drop cities");
      setEstimating(false);
      return;
    }

    try {
      const token = localStorage.getItem("rb_token");
      if (!token) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/auth?role=user"), 1000);
        return;
      }

      console.log("🚀 Fetching estimate for:", pickupCity, "→", dropCity);
      
      const { data } = await api.post("/rides/book", {
        pickupCity: pickupCity.trim(),
        dropCity: dropCity.trim(),
      });

      console.log("✅ Estimate received:", data);

      if (!data.ride) {
        throw new Error("Invalid response from server - no ride data");
      }

      console.log("📊 Setting ride data:", data.ride);
      console.log("💰 Setting fare estimate:", data.fareEstimate);
      console.log("🚗 Setting driver:", data.nearestDriver);

      setRideData(data.ride);
      setFareEstimate(data.fareEstimate);
      setDriver(data.nearestDriver);
      setLiveDistance(data.nearestDriver?.distanceFromDriverToPickupKm || 0);
      setStep("estimate");
    } catch (err) {
      let message;
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.code === "ECONNABORTED") {
        message = "Request timeout (30+ seconds). Backend is very slow or offline. Try: npm run dev:server";
      } else if (err.message?.includes("timeout")) {
        message = "Request timeout. Check if backend is running on port 5000.";
      } else if (err.message?.includes("No response") || err.message?.includes("ERR_")) {
        message = "Cannot reach backend. Make sure to run: npm run dev";
      } else {
        message = err.message || "Unable to calculate estimate";
      }
      console.error("❌ Booking error:", err);
      setError(message);
    } finally {
      setEstimating(false);
    }
  };

  const confirmRide = () => {
    setStep("confirmed");
  };

  const cancelRide = () => {
    setStep("booking");
    setRideData(null);
    setFareEstimate(null);
    setDriver(null);
    setPickupCity("");
    setDropCity("");
  };

  const logout = () => {
    clearAuth();
    navigate("/auth?role=user");
  };

  const renderBookingStep = () => (
    <div className="panel booking-panel">
      <div className="panel-header">
        <h2>🚗 Book Your Ride</h2>
        <p>Fast, reliable rides in minutes</p>
      </div>
      <form className="booking-form" onSubmit={fetchEstimate}>
        <div className="form-group">
          <label>📍 Pickup Location</label>
          <CityAutocomplete
            value={pickupCity}
            onChange={setPickupCity}
            placeholder="Where are you?"
          />
        </div>
        <div className="form-group">
          <label>🎯 Drop Location</label>
          <CityAutocomplete
            value={dropCity}
            onChange={setDropCity}
            placeholder="Where do you want to go?"
          />
        </div>

        {error && <p className="error-message">⚠️ {error}</p>}

        <button
          className="btn-primary btn-large"
          type="submit"
          disabled={estimating || !pickupCity || !dropCity}
        >
          {estimating ? (
            <>
              <span className="spinner"></span>
              Calculating fare...
            </>
          ) : (
            "View Fare & Distance"
          )}
        </button>

        {estimating && (
          <div className="loading-tips">
            <p>Please wait while we calculate the best route and fare for you...</p>
            <p style={{fontSize: "0.85em", marginTop: "8px", opacity: 0.8}}>
              If this takes more than 30 seconds, check console (F12) for errors
            </p>
          </div>
        )}
      </form>

      <div className="info-box">
        <p>Available in <strong>20+ cities</strong> • Safe and secure rides • Transparent pricing</p>
      </div>
    </div>
  );

  const renderEstimateStep = () => (
    <div className="panel estimate-panel">
      <h2>✓ Trip Summary</h2>

      {/* Route Card */}
      <div className="route-card">
        <div className="route-visual">
          <div className="route-item from">
            <span className="city-name">{pickupCity}</span>
            <span className="city-label">Pickup</span>
          </div>
          <div className="route-arrow">
            <div className="arrow-line"></div>
            <span className="arrow-icon">→</span>
          </div>
          <div className="route-item to">
            <span className="city-name">{dropCity}</span>
            <span className="city-label">Drop</span>
          </div>
        </div>
      </div>

      {/* Distance & Fare Info */}
      <div className="info-card">
        <h3>Distance & Fare Estimate</h3>
        <div className="distance-display">
          <span className="distance-value">{fareEstimate?.distance}</span>
          <span className="distance-unit">km</span>
        </div>
        <p className="algorithm-note">Accurate distance calculated for transparent pricing</p>
      </div>

      {/* Fare Breakdown */}
      <div className="fare-card">
        <h3>Fare Breakdown</h3>
        {fareEstimate ? (
          <div className="fare-rows">
            <div className="fare-row">
              <div className="fare-label">Base Fare</div>
              <div className="fare-amount">₹{fareEstimate?.baseFare || 0}</div>
            </div>
            <div className="fare-row">
              <div className="fare-label-with-note">
                <span>Distance Charge</span>
                <span className="fare-note">({fareEstimate?.distance || 0} km × ₹12/km)</span>
              </div>
              <div className="fare-amount">₹{fareEstimate?.distanceCharge || 0}</div>
            </div>
            <div className="fare-row">
              <div className="fare-label-with-note">
                <span>Platform Fee</span>
                <span className="fare-note">(8% tax)</span>
              </div>
              <div className="fare-amount">₹{fareEstimate?.platformFee || 0}</div>
            </div>
            <div className="fare-row total-row">
              <div className="fare-label">Total Fare</div>
              <div className="total-amount">₹{fareEstimate?.totalFare || 0}</div>
            </div>
          </div>
        ) : (
          <p className="error-message">Calculating fare...</p>
        )}
      </div>

      {/* Nearest Driver */}
      {driver ? (
        <div className="driver-card">
          <h3>Your Driver</h3>
          <div className="driver-detail">
            <div className="driver-avatar">{driver.name?.charAt(0) || "D"}</div>
            <div className="driver-info">
              <p className="driver-name">{driver.name}</p>
              <p className="driver-distance">{Math.round(driver.distanceFromDriverToPickupKm * 10) / 10} km away</p>
              <p className="driver-rating">4.8 rating • 234 trips</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-driver">
          <p>⏳ No available drivers at the moment</p>
        </div>
      )}

      <div className="action-buttons">
        <button className="btn-secondary" onClick={cancelRide} type="button">
          ← Change Cities
        </button>
        <button className="btn-primary btn-large" onClick={confirmRide} type="button">
          ✅ Confirm & Book
        </button>
      </div>
    </div>
  );

  const renderConfirmedStep = () => (
    <div className="panel confirmed-panel">
      <div className="success-header">
        <div className="success-icon">✅</div>
        <h2>Ride Confirmed!</h2>
        <p>Your ride has been booked successfully</p>
      </div>

      <div className="booking-confirmation">
        <div className="confirmation-item">
          <span className="label">Route</span>
          <span className="value">{pickupCity} → {dropCity}</span>
        </div>
        <div className="confirmation-item">
          <span className="label">📊 Distance</span>
          <span className="value">{fareEstimate?.distance} km</span>
        </div>
        <div className="confirmation-item">
          <span className="label">Ride ID</span>
          <span className="value ride-id">{rideData?._id?.slice(0, 12)}...</span>
        </div>
      </div>

      {/* Driver Info */}
      {driver ? (
        <div className="driver-profile-card">
          <h3>Driver Details</h3>
          <div className="driver-profile">
            <div className="driver-avatar-large">{driver.name?.charAt(0) || "D"}</div>
            <div className="driver-details">
              <p className="driver-name">{driver.name}</p>
              <p className="driver-vehicle">Maruti Swift • DL 01 AB 1234</p>
              <p className="driver-rating">4.8 • 234 trips</p>
            </div>
          </div>
          <div className="driver-status">
            <span className="status-badge">Assigned</span>
            <span className="distance-to-pickup">{liveDistance ?? driver.distanceFromDriverToPickupKm} km away</span>
          </div>
        </div>
      ) : (
        <div className="finding-driver">
          <div className="spinner"></div>
          <p>Finding a driver for you...</p>
        </div>
      )}

      {/* Total Fare */}
      <div className="total-fare-card">
        <span>Total Fare</span>
        <span className="total-fare-amount">₹{fareEstimate?.totalFare}</span>
      </div>

      <button className="btn-primary btn-large" onClick={cancelRide} style={{ marginTop: "24px" }}>
        ✨ Book Another Ride
      </button>
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>RideBook</h1>
          <p>Request a ride, get on your way</p>
        </div>
        <div className="user-section">
          <button className="btn-my-rides" onClick={() => navigate("/my-rides")} type="button">
            My Rides
          </button>
          <span className="user-name">{user?.name}</span>
          <button className="btn-logout" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        <div className="main-panel">
          {step === "booking" && renderBookingStep()}
          {step === "estimate" && renderEstimateStep()}
          {step === "confirmed" && renderConfirmedStep()}
        </div>

        <div className="info-panel">
          <div className="panel how-it-works">
            <h3>How It Works</h3>
            <div className="steps">
              <div className="step">
                <div className="step-icon">1</div>
                <p><strong>Enter Your Location</strong><br/>Tell us where you're going and where you want to go</p>
              </div>
              <div className="step">
                <div className="step-icon">2</div>
                <p><strong>View Fare Estimate</strong><br/>See the exact price before you confirm</p>
              </div>
              <div className="step">
                <div className="step-icon">3</div>
                <p><strong>Confirm Your Ride</strong><br/>Accept the ride to begin your journey</p>
              </div>
              <div className="step">
                <div className="step-icon">4</div>
                <p><strong>Get Picked Up</strong><br/>Your driver is on the way to you</p>
              </div>
            </div>
          </div>

          <div className="panel app-features">
            <h3>Why Choose Us</h3>
            <div className="features-list">
              <div className="feature-item">
                <span>✓ Transparent Pricing</span>
                <p>See exact fare before confirming</p>
              </div>
              <div className="feature-item">
                <span>✓ Quick Matching</span>
                <p>Instant driver assignment</p>
              </div>
              <div className="feature-item">
                <span>✓ Safe & Secure</span>
                <p>Verified drivers & secure payment</p>
              </div>
              <div className="feature-item">
                <span>✓ 24/7 Support</span>
                <p>Available round the clock</p>
              </div>
            </div>
          </div>

          <div className="panel app-info">
            <h3>About This App</h3>
            <p>A reliable ride-sharing platform connecting users with verified drivers. Get from point A to point B safely and affordably.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
