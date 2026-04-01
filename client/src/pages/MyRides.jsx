import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { getUser } from "../lib/storage";
import "./MyRides.css";

const MyRides = () => {
  const navigate = useNavigate();
  const [user] = useState(getUser());
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, ongoing, completed
  const [selectedRide, setSelectedRide] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "user") {
      navigate("/auth?role=user");
      return;
    }

    fetchRides();
  }, [navigate, user]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching user rides...");

      const response = await api.get("/my-rides");
      console.log("My Rides Response:", response);

      if (response.data.success) {
        setRides(response.data.rides);
      } else {
        setError(response.data.error || "Failed to fetch rides");
      }
    } catch (err) {
      console.error("Error fetching rides:", err);
      setError(err.response?.data?.error || "Failed to load rides");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      searching: "🔍",
      assigned: "✓",
      ongoing: "🚗",
      completed: "✅",
      cancelled: "❌",
    };
    return icons[status] || "•";
  };

  const getStatusColor = (status) => {
    const colors = {
      searching: "#ff9800",
      assigned: "#2196f3",
      ongoing: "#4caf50",
      completed: "#8bc34a",
      cancelled: "#f44336",
    };
    return colors[status] || "#999";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredRides = rides.filter((ride) => {
    if (activeTab === "all") return true;
    if (activeTab === "ongoing") return ride.status === "ongoing";
    if (activeTab === "completed") return ride.status === "completed";
    return true;
  });

  return (
    <div className="my-rides-container">
      {/* Header */}
      <div className="my-rides-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <h1>🚗 My Rides</h1>
          <button className="refresh-btn" onClick={fetchRides} disabled={loading}>
            {loading ? "⟳ Loading..." : "⟳ Refresh"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="rides-stats">
        <div className="stat-card">
          <div className="stat-number">{rides.length}</div>
          <div className="stat-label">Total Rides</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {rides.filter((r) => r.status === "ongoing").length}
          </div>
          <div className="stat-label">Ongoing</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {rides.filter((r) => r.status === "completed").length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            ₹{rides.reduce((sum, r) => sum + (r.fare || 0), 0)}
          </div>
          <div className="stat-label">Total Spent</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rides-tabs">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All ({rides.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "ongoing" ? "active" : ""}`}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing ({rides.filter((r) => r.status === "ongoing").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({rides.filter((r) => r.status === "completed").length})
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your rides...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRides.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚕</div>
          <h3>No rides yet</h3>
          <p>
            {activeTab === "all"
              ? "Start by booking your first ride!"
              : `No ${activeTab} rides found.`}
          </p>
          <button className="book-btn" onClick={() => navigate("/dashboard")}>
            Book a Ride
          </button>
        </div>
      )}

      {/* Rides List */}
      {!loading && filteredRides.length > 0 && (
        <div className="rides-list">
          {filteredRides.map((ride) => (
            <div
              key={ride.id}
              className="ride-card"
              onClick={() => setSelectedRide(ride)}
            >
              {/* Status Badge */}
              <div
                className="status-badge"
                style={{ backgroundColor: getStatusColor(ride.status) }}
              >
                <span className="status-icon">{getStatusIcon(ride.status)}</span>
                <span className="status-text">{ride.status.toUpperCase()}</span>
              </div>

              {/* Route */}
              <div className="ride-route">
                <div className="route-point pickup">
                  <div className="point-marker">📍</div>
                  <div>
                    <div className="point-label">Pickup</div>
                    <div className="point-city">{ride.pickupCity}</div>
                  </div>
                </div>

                <div className="route-line">
                  <div className="line"></div>
                  <div className="distance-badge">{ride.distance} km</div>
                </div>

                <div className="route-point dropoff">
                  <div className="point-marker">📌</div>
                  <div>
                    <div className="point-label">Dropoff</div>
                    <div className="point-city">{ride.dropCity}</div>
                  </div>
                </div>
              </div>

              {/* Details Row */}
              <div className="ride-details">
                <div className="detail">
                  <span className="detail-icon">💰</span>
                  <div>
                    <div className="detail-label">Fare</div>
                    <div className="detail-value">₹{ride.fare}</div>
                  </div>
                </div>

                <div className="detail">
                  <span className="detail-icon">⏰</span>
                  <div>
                    <div className="detail-label">Booked</div>
                    <div className="detail-value">
                      {new Date(ride.bookedAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </div>

                {ride.driver && (
                  <div className="detail">
                    <span className="detail-icon">👤</span>
                    <div>
                      <div className="detail-label">Driver</div>
                      <div className="detail-value">{ride.driver.name}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="ride-footer">
                <div className="driver-info">
                  {ride.driver ? (
                    <>
                      <span>🚗 {ride.driver.vehicleNumber}</span>
                      <span>⭐ {ride.driver.rating}</span>
                    </>
                  ) : (
                    <span>No driver assigned</span>
                  )}
                </div>
                <button className="view-details-btn">View Details →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ride Details Modal */}
      {selectedRide && (
        <div className="modal-overlay" onClick={() => setSelectedRide(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedRide(null)}
            >
              ✕
            </button>

            <h2>Ride Details</h2>

            <div className="modal-route">
              <div className="modal-point">
                <div className="modal-marker">📍</div>
                <div>
                  <div className="modal-label">From</div>
                  <div className="modal-value">{selectedRide.pickupCity}</div>
                </div>
              </div>
              <div className="modal-arrow">→</div>
              <div className="modal-point">
                <div className="modal-marker">📌</div>
                <div>
                  <div className="modal-label">To</div>
                  <div className="modal-value">{selectedRide.dropCity}</div>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Trip Details</h3>
              <div className="detail-row">
                <span>Distance</span>
                <span className="value">{selectedRide.distance} km</span>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <span
                  className="value status"
                  style={{ color: getStatusColor(selectedRide.status) }}
                >
                  {selectedRide.status.toUpperCase()}
                </span>
              </div>
              <div className="detail-row">
                <span>Booked On</span>
                <span className="value">{formatDate(selectedRide.bookedAt)}</span>
              </div>
            </div>

            <div className="modal-section">
              <h3>Fare Breakdown</h3>
              <div className="detail-row">
                <span>Base Fare</span>
                <span className="value">₹50</span>
              </div>
              <div className="detail-row">
                <span>Distance Charge</span>
                <span className="value">
                  ₹{Math.round(selectedRide.distance * 12)}
                </span>
              </div>
              <div className="detail-row">
                <span>Platform Fee (8%)</span>
                <span className="value">
                  ₹{Math.round(selectedRide.fare * 0.08)}
                </span>
              </div>
              <div className="detail-row total">
                <span>Total Fare</span>
                <span className="value">₹{selectedRide.fare}</span>
              </div>
            </div>

            {selectedRide.driver && (
              <div className="modal-section">
                <h3>Driver Information</h3>
                <div className="driver-card">
                  <div className="driver-avatar">👤</div>
                  <div className="driver-details">
                    <div className="driver-name">{selectedRide.driver.name}</div>
                    <div className="driver-vehicle">
                      {selectedRide.driver.vehicleNumber}
                    </div>
                    <div className="driver-rating">
                      ⭐ {selectedRide.driver.rating} | 📞{" "}
                      {selectedRide.driver.phone}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button className="modal-close-btn" onClick={() => setSelectedRide(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRides;
